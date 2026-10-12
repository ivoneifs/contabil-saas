import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssistenteService } from '../assistente/assistente.service';
import { MODELOS } from './catalogo';

const REGIME: Record<string, string> = {
  MEI: 'MEI',
  SIMPLES_NACIONAL: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
};

const SYSTEM = `Você redige documentos para um escritório de contabilidade brasileiro.
Escreva o documento completo pedido, pronto para uso, em português do Brasil formal.
Regras:
- Use os dados do escritório e do cliente fornecidos. O que faltar, deixe como campo entre colchetes, ex.: [CPF DO SÓCIO].
- Estruture com título, qualificação das partes, cláusulas ou parágrafos numerados quando couber, local, data e assinaturas.
- Cite leis apenas quando tiver certeza do número e do artigo; na dúvida, descreva a regra sem citar número.
- Não use markdown pesado: só o título em uma linha e o texto corrido; listas simples quando necessário.
- Não acrescente comentários antes ou depois do documento.`;

@Injectable()
export class ModelosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assistente: AssistenteService,
  ) {}

  listar() {
    return MODELOS;
  }

  async gerar(organizationId: string, modeloId: string, clientId?: string, instrucoes?: string) {
    const modelo = MODELOS.find((m) => m.id === modeloId);
    if (!modelo) throw new NotFoundException('Modelo não encontrado.');

    const [org, client] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true, cnpj: true } }),
      clientId ? this.prisma.client.findFirst({ where: { id: clientId, organizationId } }) : null,
    ]);
    if (clientId && !client) throw new NotFoundException('Cliente não encontrado.');

    const dados = [
      `Documento: ${modelo.titulo} (categoria: ${modelo.categoria})`,
      `Escritório contábil: ${org?.name ?? '[NOME DO ESCRITÓRIO]'}${org?.cnpj ? `, CNPJ ${org.cnpj}` : ''}`,
      client
        ? `Cliente: ${client.razaoSocial}${client.nomeFantasia ? ` (${client.nomeFantasia})` : ''}, CNPJ/CPF ${client.cnpjCpf}, ` +
          `regime ${client.regimeTributario ? REGIME[client.regimeTributario] : '[REGIME]'}, ` +
          `${client.municipio ?? '[MUNICÍPIO]'}/${client.uf}` +
          `${client.email ? `, e-mail ${client.email}` : ''}${client.telefone ? `, telefone ${client.telefone}` : ''}`
        : 'Cliente: não informado (use campos entre colchetes).',
      `Data de hoje: ${new Date().toLocaleDateString('pt-BR')}`,
      instrucoes ? `Instruções adicionais do contador: ${instrucoes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const texto = await this.assistente.completar(SYSTEM, dados);
    return { modelo, texto };
  }
}
