import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RegimeTributario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultasService } from '../consultas/consultas.service';
import { cnpjValido, cpfValido } from '../common/documentos';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

const MAX_IMPORTACAO = 200;

interface DadosCnpj {
  razao_social: string;
  nome_fantasia?: string;
  uf: string;
  municipio?: string;
  email?: string | null;
  ddd_telefone_1?: string;
  opcao_pelo_simples?: boolean | null;
  opcao_pelo_mei?: boolean | null;
}

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consultas: ConsultasService,
  ) {}

  // Cadastra vários clientes de uma vez. CNPJ: dados preenchidos pela
  // Receita (BrasilAPI). CPF: pessoa física com o nome informado (não existe
  // consulta pública de CPF). Repetidos e inválidos voltam no relatório.
  async importar(organizationId: string, entrada: { documento: string; nome?: string; uf?: string }[], ufPadrao = 'BA', contadorId?: string) {
    if (contadorId && !(await this.prisma.contador.findFirst({ where: { id: contadorId, organizationId } }))) {
      throw new BadRequestException('Contador não encontrado.');
    }
    const vistos = new Set<string>();
    const itens = entrada
      .map((i) => ({ ...i, documento: i.documento.replace(/\D/g, ''), nome: i.nome?.trim() || undefined }))
      .filter((i) => i.documento && !vistos.has(i.documento) && vistos.add(i.documento));
    if (!itens.length) throw new BadRequestException('Informe ao menos um CPF ou CNPJ.');
    if (itens.length > MAX_IMPORTACAO) throw new BadRequestException(`Importe no máximo ${MAX_IMPORTACAO} por vez.`);

    const existentes = new Set(
      (await this.prisma.client.findMany({ where: { organizationId, cnpjCpf: { in: itens.map((i) => i.documento) } }, select: { cnpjCpf: true } })).map((c) => c.cnpjCpf),
    );

    const resultado: { documento: string; tipo: 'PJ' | 'PF' | '?'; status: 'criado' | 'existente' | 'erro'; razaoSocial?: string; erro?: string }[] = [];
    const fila = [...itens];
    const worker = async () => {
      for (let item = fila.shift(); item; item = fila.shift()) {
        const doc = item.documento;
        const tipo = doc.length === 14 ? 'PJ' : doc.length === 11 ? 'PF' : '?';
        if (tipo === '?') {
          resultado.push({ documento: doc, tipo, status: 'erro', erro: 'Não é CPF (11 dígitos) nem CNPJ (14 dígitos).' });
          continue;
        }
        if (tipo === 'PJ' ? !cnpjValido(doc) : !cpfValido(doc)) {
          resultado.push({ documento: doc, tipo, status: 'erro', erro: `${tipo === 'PJ' ? 'CNPJ' : 'CPF'} com dígito verificador inválido.` });
          continue;
        }
        if (existentes.has(doc)) {
          // Já cadastrado: só passa a constar na carteira do contador.
          if (contadorId) await this.prisma.client.updateMany({ where: { organizationId, cnpjCpf: doc }, data: { contadorId } });
          resultado.push({ documento: doc, tipo, status: 'existente' });
          continue;
        }
        try {
          if (tipo === 'PF') {
            if (!item.nome) throw new Error('Informe o nome da pessoa física.');
            const c = await this.prisma.client.create({
              data: { organizationId, contadorId, cnpjCpf: doc, razaoSocial: item.nome.toUpperCase(), uf: (item.uf || ufPadrao).toUpperCase().slice(0, 2) },
            });
            resultado.push({ documento: doc, tipo, status: 'criado', razaoSocial: c.razaoSocial });
            continue;
          }
          const d = (await this.consultas.cnpj(doc)) as DadosCnpj;
          const client = await this.prisma.client.create({
            data: {
              organizationId,
              contadorId,
              cnpjCpf: doc,
              razaoSocial: d.razao_social,
              nomeFantasia: d.nome_fantasia || null,
              uf: d.uf,
              municipio: d.municipio || null,
              email: d.email?.toLowerCase() || null,
              telefone: d.ddd_telefone_1?.trim() || null,
              regimeTributario: d.opcao_pelo_mei ? RegimeTributario.MEI : d.opcao_pelo_simples ? RegimeTributario.SIMPLES_NACIONAL : null,
            },
          });
          resultado.push({ documento: doc, tipo, status: 'criado', razaoSocial: client.razaoSocial });
        } catch (err) {
          resultado.push({ documento: doc, tipo, status: 'erro', erro: err instanceof Error ? err.message : 'Falha ao importar.' });
        }
      }
    };
    // Poucas requisições em paralelo para não estourar o limite da BrasilAPI.
    await Promise.all(Array.from({ length: 3 }, worker));

    const conta = (s: string) => resultado.filter((r) => r.status === s).length;
    return { criados: conta('criado'), existentes: conta('existente'), erros: conta('erro'), resultado };
  }

  // Compatível com a importação antiga (só CNPJs).
  importarCnpjs(organizationId: string, cnpjs: string[]) {
    return this.importar(organizationId, cnpjs.map((documento) => ({ documento })));
  }

  create(organizationId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: { ...dto, organizationId },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.client.findMany({
      where: { organizationId },
      include: { contador: { select: { id: true, nome: true, crcUf: true, crcNumero: true } } },
      orderBy: { razaoSocial: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    // organizationId always in the where clause: a user from another tenant
    // gets a 404, never a 200 with someone else's data.
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    return client;
  }

  async update(organizationId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(organizationId, id);
    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.client.delete({ where: { id } });
    return { success: true };
  }
}
