import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { unzipSync, zipSync } from 'fflate';
import { DirecaoDocFiscal, FormatoArquivoFiscal, ModeloDocFiscal, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { chaveNoPdf, lerXmlFiscal, modeloPelaChave } from './leitor-xml';

const MAX_XML = 10 * 1024 * 1024;
const MAX_PDF = 30 * 1024 * 1024;
const MAX_ZIP_ENTRADAS = 3000;
const MAX_ZIP_TOTAL = 400 * 1024 * 1024;
const MAX_EXPORTAR = 5000;

export interface ArquivoRecebido {
  nome: string;
  conteudo: Buffer;
}

export type StatusImportacao = 'importado' | 'duplicado' | 'ignorado' | 'erro';

export interface ResultadoArquivo {
  arquivo: string;
  status: StatusImportacao;
  modelo?: ModeloDocFiscal;
  formato?: FormatoArquivoFiscal;
  numero?: string | null;
  chave?: string | null;
  cliente?: string | null;
  mensagem?: string;
}

export interface FiltrosDocFiscal {
  modelo?: ModeloDocFiscal;
  formato?: FormatoArquivoFiscal;
  direcao?: DirecaoDocFiscal;
  clientId?: string;
  situacao?: string;
  de?: string;
  ate?: string;
  busca?: string;
}

const SELECT_LISTA = {
  id: true,
  clientId: true,
  modelo: true,
  formato: true,
  direcao: true,
  chaveAcesso: true,
  numero: true,
  serie: true,
  dataEmissao: true,
  emitenteDoc: true,
  emitenteNome: true,
  destinatarioDoc: true,
  destinatarioNome: true,
  valorTotal: true,
  naturezaOperacao: true,
  protocolo: true,
  situacao: true,
  descricaoEvento: true,
  nomeArquivo: true,
  tamanhoBytes: true,
  createdAt: true,
  client: { select: { razaoSocial: true } },
} as const;

const extensao = (nome: string) => nome.toLowerCase().split('.').pop() ?? '';

@Injectable()
export class DocumentosFiscaisService {
  constructor(private readonly prisma: PrismaService) {}

  // Abre ZIPs (inclusive ZIP dentro de ZIP, um nível) e devolve só XML e PDF.
  private expandir(arquivos: ArquivoRecebido[], resultado: ResultadoArquivo[]): ArquivoRecebido[] {
    const saida: ArquivoRecebido[] = [];
    let total = 0;
    const abrirZip = (zip: ArquivoRecebido, nivel: number) => {
      let entradas: Record<string, Uint8Array>;
      let contagem = 0;
      try {
        entradas = unzipSync(new Uint8Array(zip.conteudo), {
          filter: (f) => {
            const ext = extensao(f.name);
            if (f.name.startsWith('__MACOSX') || f.name.endsWith('/')) return false;
            if (!['xml', 'pdf', 'zip'].includes(ext)) return false;
            if (++contagem > MAX_ZIP_ENTRADAS) throw new BadRequestException(`O ZIP ${zip.nome} tem arquivos demais (máx. ${MAX_ZIP_ENTRADAS}).`);
            total += f.originalSize;
            if (total > MAX_ZIP_TOTAL) throw new BadRequestException('Os ZIPs descompactados passam de 400 MB. Envie em partes.');
            return true;
          },
        });
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        resultado.push({ arquivo: zip.nome, status: 'erro', mensagem: 'ZIP corrompido ou protegido por senha.' });
        return;
      }
      for (const [nome, dados] of Object.entries(entradas)) {
        const item = { nome: `${zip.nome} › ${nome.split('/').pop()}`, conteudo: Buffer.from(dados) };
        if (extensao(nome) === 'zip') {
          if (nivel < 1) abrirZip(item, nivel + 1);
          else resultado.push({ arquivo: item.nome, status: 'ignorado', mensagem: 'ZIP dentro de ZIP em mais de um nível.' });
        } else saida.push(item);
      }
    };
    for (const a of arquivos) {
      const ext = extensao(a.nome);
      if (ext === 'zip') abrirZip(a, 0);
      else if (ext === 'xml' || ext === 'pdf') saida.push(a);
      else resultado.push({ arquivo: a.nome, status: 'ignorado', mensagem: 'Formato não aceito (use XML, PDF ou ZIP).' });
    }
    return saida;
  }

  async importar(organizationId: string, arquivos: ArquivoRecebido[], clientIdForcado?: string) {
    if (!arquivos.length) throw new BadRequestException('Nenhum arquivo enviado.');
    if (clientIdForcado) {
      const c = await this.prisma.client.findFirst({ where: { id: clientIdForcado, organizationId } });
      if (!c) throw new NotFoundException('Cliente não encontrado.');
    }

    const resultado: ResultadoArquivo[] = [];
    const itens = this.expandir(arquivos, resultado);

    const clientes = await this.prisma.client.findMany({ where: { organizationId }, select: { id: true, cnpjCpf: true, razaoSocial: true } });
    const porDoc = new Map(clientes.map((c) => [c.cnpjCpf.replace(/\D/g, ''), c]));
    const nomeCliente = new Map(clientes.map((c) => [c.id, c.razaoSocial]));

    for (const item of itens) {
      const ext = extensao(item.nome);
      try {
        if (ext === 'xml' && item.conteudo.length > MAX_XML) throw new Error('XML maior que 10 MB.');
        if (ext === 'pdf' && item.conteudo.length > MAX_PDF) throw new Error('PDF maior que 30 MB.');
        const hash = createHash('sha256').update(item.conteudo).digest('hex');
        const existente = await this.prisma.documentoFiscal.findUnique({
          where: { organizationId_hash: { organizationId, hash } },
          select: { modelo: true, numero: true, chaveAcesso: true },
        });
        if (existente) {
          resultado.push({ arquivo: item.nome, status: 'duplicado', modelo: existente.modelo, numero: existente.numero, chave: existente.chaveAcesso, mensagem: 'Este arquivo já foi importado.' });
          continue;
        }

        const base = {
          organizationId,
          nomeArquivo: item.nome.split(' › ').pop()!.slice(0, 255),
          tamanhoBytes: item.conteudo.length,
          hash,
          conteudo: new Uint8Array(item.conteudo),
        };

        if (ext === 'pdf') {
          if (!item.conteudo.subarray(0, 1024).toString('latin1').includes('%PDF')) throw new Error('Arquivo não é um PDF válido.');
          const chave = chaveNoPdf(item.nome, item.conteudo);
          // Herda os dados do XML da mesma chave, se já houver.
          const xml = chave
            ? await this.prisma.documentoFiscal.findFirst({ where: { organizationId, chaveAcesso: chave, formato: 'XML' }, select: SELECT_LISTA })
            : null;
          const criado = await this.prisma.documentoFiscal.create({
            data: {
              ...base,
              formato: 'PDF',
              mimeType: 'application/pdf',
              modelo: xml?.modelo ?? modeloPelaChave(chave),
              chaveAcesso: chave,
              clientId: clientIdForcado ?? xml?.clientId ?? null,
              direcao: xml?.direcao ?? null,
              numero: xml?.numero ?? (chave ? String(Number(chave.slice(25, 34))) : null),
              serie: xml?.serie ?? (chave ? String(Number(chave.slice(22, 25))) : null),
              dataEmissao: xml?.dataEmissao ?? null,
              emitenteDoc: xml?.emitenteDoc ?? (chave ? chave.slice(6, 20) : null),
              emitenteNome: xml?.emitenteNome ?? null,
              destinatarioDoc: xml?.destinatarioDoc ?? null,
              destinatarioNome: xml?.destinatarioNome ?? null,
              valorTotal: xml?.valorTotal ?? null,
              situacao: xml?.situacao ?? null,
            },
          });
          resultado.push({
            arquivo: item.nome,
            status: 'importado',
            formato: 'PDF',
            modelo: criado.modelo,
            numero: criado.numero,
            chave,
            cliente: criado.clientId ? nomeCliente.get(criado.clientId) ?? null : null,
            mensagem: chave ? (xml ? 'Ligado ao XML da mesma chave.' : 'Chave identificada; envie o XML para completar os dados.') : 'Chave não encontrada no PDF; dados mínimos.',
          });
          continue;
        }

        const d = lerXmlFiscal(item.conteudo);
        if (d.modelo === 'DESCONHECIDO') throw new Error('XML não reconhecido como documento fiscal (NF-e, NFC-e, CT-e, MDF-e, NFS-e ou evento).');

        // Vincula ao cliente: emitente = saída; destinatário = entrada.
        let clientId = clientIdForcado ?? null;
        let direcao: DirecaoDocFiscal | null = null;
        const emit = d.emitenteDoc ? porDoc.get(d.emitenteDoc) : undefined;
        const dest = d.destinatarioDoc ? porDoc.get(d.destinatarioDoc) : undefined;
        if (clientIdForcado) {
          const docForcado = clientes.find((c) => c.id === clientIdForcado)?.cnpjCpf.replace(/\D/g, '');
          direcao = docForcado && docForcado === d.emitenteDoc ? 'SAIDA' : docForcado && docForcado === d.destinatarioDoc ? 'ENTRADA' : null;
        } else if (emit) {
          clientId = emit.id;
          direcao = 'SAIDA';
        } else if (dest) {
          clientId = dest.id;
          direcao = 'ENTRADA';
        }
        if (d.modelo === 'EVENTO') direcao = null;

        const { chaveAfetada, cancelamento, ...campos } = d;
        await this.prisma.documentoFiscal.create({
          data: {
            ...base,
            ...campos,
            formato: 'XML',
            mimeType: 'application/xml',
            clientId,
            direcao,
            valorTotal: d.valorTotal,
            chaveAcesso: d.modelo === 'EVENTO' ? chaveAfetada ?? d.chaveAcesso : d.chaveAcesso,
          },
        });

        let mensagem: string | undefined;
        if (d.modelo !== 'EVENTO' && d.chaveAcesso) {
          // Completa PDFs da mesma chave que chegaram antes do XML.
          const atualizados = await this.prisma.documentoFiscal.updateMany({
            where: { organizationId, chaveAcesso: d.chaveAcesso, formato: 'PDF' },
            data: {
              modelo: d.modelo,
              clientId,
              direcao,
              numero: d.numero,
              serie: d.serie,
              dataEmissao: d.dataEmissao,
              emitenteDoc: d.emitenteDoc,
              emitenteNome: d.emitenteNome,
              destinatarioDoc: d.destinatarioDoc,
              destinatarioNome: d.destinatarioNome,
              valorTotal: d.valorTotal,
              situacao: d.situacao,
            },
          });
          if (atualizados.count) mensagem = 'PDF da mesma chave atualizado.';
          // Se o cancelamento chegou antes, já marca.
          const evento = await this.prisma.documentoFiscal.findFirst({
            where: { organizationId, modelo: 'EVENTO', chaveAcesso: d.chaveAcesso, situacao: 'HOMOLOGADO', descricaoEvento: { contains: 'ancelamento' } },
          });
          if (evento) await this.marcarCancelada(organizationId, d.chaveAcesso);
        }
        if (cancelamento && chaveAfetada) {
          const n = await this.marcarCancelada(organizationId, chaveAfetada);
          mensagem = n ? 'Documento marcado como CANCELADO.' : 'Cancelamento registrado; o documento ainda não foi importado.';
        }

        resultado.push({
          arquivo: item.nome,
          status: 'importado',
          formato: 'XML',
          modelo: d.modelo,
          numero: d.numero,
          chave: d.modelo === 'EVENTO' ? chaveAfetada ?? null : d.chaveAcesso,
          cliente: clientId ? nomeCliente.get(clientId) ?? null : null,
          mensagem: mensagem ?? (clientId ? undefined : 'Nenhum cliente com este CNPJ; ficou sem vínculo.'),
        });
      } catch (err) {
        resultado.push({ arquivo: item.nome, status: 'erro', mensagem: err instanceof Error ? err.message : 'Falha ao importar.' });
      }
    }

    const conta = (s: StatusImportacao) => resultado.filter((r) => r.status === s).length;
    return { importados: conta('importado'), duplicados: conta('duplicado'), ignorados: conta('ignorado'), erros: conta('erro'), resultado };
  }

  private async marcarCancelada(organizationId: string, chave: string) {
    const r = await this.prisma.documentoFiscal.updateMany({
      where: { organizationId, chaveAcesso: chave, modelo: { not: 'EVENTO' } },
      data: { situacao: 'CANCELADA' },
    });
    return r.count;
  }

  private where(organizationId: string, f: FiltrosDocFiscal): Prisma.DocumentoFiscalWhereInput {
    const busca = f.busca?.trim();
    const digitos = busca?.replace(/\D/g, '');
    return {
      organizationId,
      ...(f.modelo ? { modelo: f.modelo } : {}),
      ...(f.formato ? { formato: f.formato } : {}),
      ...(f.direcao ? { direcao: f.direcao } : {}),
      ...(f.clientId ? { clientId: f.clientId } : {}),
      ...(f.situacao ? { situacao: f.situacao } : {}),
      ...(f.de || f.ate
        ? {
            dataEmissao: {
              ...(f.de ? { gte: new Date(`${f.de}T00:00:00-03:00`) } : {}),
              ...(f.ate ? { lte: new Date(`${f.ate}T23:59:59-03:00`) } : {}),
            },
          }
        : {}),
      ...(busca
        ? {
            OR: [
              { emitenteNome: { contains: busca, mode: 'insensitive' } },
              { destinatarioNome: { contains: busca, mode: 'insensitive' } },
              { nomeArquivo: { contains: busca, mode: 'insensitive' } },
              { numero: busca },
              ...(digitos && digitos.length >= 4
                ? [{ chaveAcesso: { contains: digitos } }, { emitenteDoc: { contains: digitos } }, { destinatarioDoc: { contains: digitos } }]
                : []),
            ],
          }
        : {}),
    };
  }

  async listar(organizationId: string, f: FiltrosDocFiscal, pagina = 1, porPagina = 50) {
    const where = this.where(organizationId, f);
    const tamanho = Math.min(Math.max(porPagina, 10), 200);
    const [itens, total, soma] = await Promise.all([
      this.prisma.documentoFiscal.findMany({
        where,
        orderBy: [{ dataEmissao: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        skip: (Math.max(pagina, 1) - 1) * tamanho,
        take: tamanho,
        select: SELECT_LISTA,
      }),
      this.prisma.documentoFiscal.count({ where }),
      this.prisma.documentoFiscal.aggregate({
        where: { ...where, formato: 'XML', modelo: { not: 'EVENTO' }, NOT: { situacao: 'CANCELADA' } },
        _sum: { valorTotal: true },
      }),
    ]);
    return { itens, total, pagina: Math.max(pagina, 1), porPagina: tamanho, valorTotal: Number(soma._sum.valorTotal ?? 0) };
  }

  async resumo(organizationId: string) {
    const [grupos, valores] = await Promise.all([
      this.prisma.documentoFiscal.groupBy({
        by: ['modelo', 'formato'],
        where: { organizationId },
        _count: { _all: true },
      }),
      // Valor só dos XMLs não cancelados.
      this.prisma.documentoFiscal.groupBy({
        by: ['modelo'],
        where: { organizationId, formato: 'XML', NOT: { situacao: 'CANCELADA' } },
        _sum: { valorTotal: true },
      }),
    ]);
    const valorPorModelo = new Map(valores.map((v) => [v.modelo, Number(v._sum.valorTotal ?? 0)]));
    return grupos.map((g) => ({
      modelo: g.modelo,
      formato: g.formato,
      quantidade: g._count._all,
      valor: g.formato === 'XML' ? valorPorModelo.get(g.modelo) ?? 0 : null,
    }));
  }

  async detalhe(organizationId: string, id: string) {
    const d = await this.prisma.documentoFiscal.findFirst({ where: { id, organizationId }, select: SELECT_LISTA });
    if (!d) throw new NotFoundException('Documento não encontrado.');
    const relacionados = d.chaveAcesso
      ? await this.prisma.documentoFiscal.findMany({
          where: { organizationId, chaveAcesso: d.chaveAcesso, id: { not: id } },
          select: { id: true, formato: true, modelo: true, nomeArquivo: true, descricaoEvento: true, situacao: true },
        })
      : [];
    return { ...d, relacionados };
  }

  async arquivo(organizationId: string, id: string) {
    const d = await this.prisma.documentoFiscal.findFirst({
      where: { id, organizationId },
      select: { nomeArquivo: true, mimeType: true, conteudo: true },
    });
    if (!d) throw new NotFoundException('Documento não encontrado.');
    return d;
  }

  async exportarZip(organizationId: string, ids: string[] | undefined, f: FiltrosDocFiscal) {
    const where = ids?.length ? { organizationId, id: { in: ids } } : this.where(organizationId, f);
    const total = await this.prisma.documentoFiscal.count({ where });
    if (!total) throw new BadRequestException('Nenhum documento para exportar.');
    if (total > MAX_EXPORTAR) throw new BadRequestException(`São ${total} arquivos; filtre para no máximo ${MAX_EXPORTAR}.`);
    const docs = await this.prisma.documentoFiscal.findMany({
      where,
      select: { modelo: true, formato: true, nomeArquivo: true, conteudo: true, chaveAcesso: true, id: true },
    });
    const arquivos: Record<string, Uint8Array> = {};
    for (const d of docs) {
      let nome = `${d.modelo}/${d.formato}/${d.nomeArquivo}`;
      if (arquivos[nome]) nome = nome.replace(/(\.\w+)$/, `-${d.id.slice(0, 8)}$1`);
      arquivos[nome] = new Uint8Array(d.conteudo);
    }
    return Buffer.from(zipSync(arquivos, { level: 6 }));
  }

  async vincularCliente(organizationId: string, id: string, clientId: string | null) {
    const d = await this.prisma.documentoFiscal.findFirst({ where: { id, organizationId } });
    if (!d) throw new NotFoundException('Documento não encontrado.');
    if (clientId && !(await this.prisma.client.findFirst({ where: { id: clientId, organizationId } }))) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    await this.prisma.documentoFiscal.update({ where: { id }, data: { clientId } });
    return { ok: true };
  }

  async remover(organizationId: string, ids: string[]) {
    const r = await this.prisma.documentoFiscal.deleteMany({ where: { organizationId, id: { in: ids } } });
    return { removidos: r.count };
  }
}
