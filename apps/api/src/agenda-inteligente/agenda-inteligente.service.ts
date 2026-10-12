import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultasService } from '../consultas/consultas.service';
import { AssistenteService } from '../assistente/assistente.service';
import { REGRAS, calcularPrazo } from './regras';

const SYSTEM_PLANO = `Você organiza a semana de trabalho de um escritório de contabilidade.
Recebe a lista de obrigações pendentes (com prazo e cliente) e de compromissos.
Monte um plano prático em português do Brasil, em JSON no formato:
{"resumo": string, "alertas": string[], "dias": [{"dia": "AAAA-MM-DD", "foco": string, "tarefas": string[]}]}
Regras: priorize o que vence primeiro e o que está atrasado; distribua a carga entre os dias úteis
dos próximos 7 dias; não invente obrigações nem clientes que não estejam na lista; seja objetivo.`;

@Injectable()
export class AgendaInteligenteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consultas: ConsultasService,
    private readonly assistente: AssistenteService,
  ) {}

  private async feriados(anos: number[]) {
    const set = new Set<string>();
    for (const ano of new Set(anos)) {
      try {
        (await this.consultas.feriados(ano)).forEach((f) => set.add(f.date));
      } catch {
        // Sem feriados (BrasilAPI fora do ar): só fins de semana são ajustados.
      }
    }
    return set;
  }

  // Gera as obrigações da competência para todos os clientes com regime
  // informado. Não duplica o que já existe (mesmo cliente, título e competência).
  async gerar(organizationId: string, competencia: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia)) {
      throw new BadRequestException('Competência deve estar no formato AAAA-MM.');
    }
    const [ano, mes] = competencia.split('-').map(Number);
    const feriados = await this.feriados([ano, ano + 1]);

    const clientes = await this.prisma.client.findMany({
      where: { organizationId },
      select: {
        id: true,
        razaoSocial: true,
        regimeTributario: true,
        _count: { select: { funcionarios: { where: { dataDemissao: null } } } },
      },
    });

    const existentes = new Set(
      (
        await this.prisma.obrigacaoFiscal.findMany({
          where: { organizationId, competencia },
          select: { clientId: true, titulo: true },
        })
      ).map((o) => `${o.clientId}|${o.titulo}`),
    );

    const novas: { organizationId: string; clientId: string; titulo: string; competencia: string; prazo: Date }[] = [];
    const semRegime: string[] = [];

    for (const c of clientes) {
      if (!c.regimeTributario) {
        semRegime.push(c.razaoSocial);
        continue;
      }
      const perfil = { regime: c.regimeTributario, temFuncionarios: c._count.funcionarios > 0 };
      for (const regra of REGRAS) {
        if (!regra.aplica(perfil, mes)) continue;
        if (existentes.has(`${c.id}|${regra.titulo}`)) continue;
        novas.push({
          organizationId,
          clientId: c.id,
          titulo: regra.titulo,
          competencia,
          prazo: calcularPrazo(regra, competencia, feriados),
        });
      }
    }

    if (novas.length) await this.prisma.obrigacaoFiscal.createMany({ data: novas });

    return {
      competencia,
      criadas: novas.length,
      jaExistiam: existentes.size,
      clientesSemRegime: semRegime,
    };
  }

  regras() {
    return REGRAS.map((r) => ({ titulo: r.titulo, fonte: r.fonte, vencimento: r.vencimento }));
  }

  async plano(organizationId: string) {
    const agora = new Date();
    const limite = new Date(agora.getTime() + 14 * 86400000);
    const [obrigacoes, compromissos] = await Promise.all([
      this.prisma.obrigacaoFiscal.findMany({
        where: { organizationId, status: { not: 'ENTREGUE' }, prazo: { lte: limite } },
        orderBy: { prazo: 'asc' },
        take: 150,
        select: { titulo: true, prazo: true, status: true, competencia: true, client: { select: { razaoSocial: true } } },
      }),
      this.prisma.compromisso.findMany({
        where: { organizationId, status: 'AGENDADO', inicio: { gte: agora, lte: limite } },
        orderBy: { inicio: 'asc' },
        take: 50,
        select: { titulo: true, inicio: true, client: { select: { razaoSocial: true } } },
      }),
    ]);

    if (!obrigacoes.length && !compromissos.length) {
      return { resumo: 'Nada pendente para os próximos 14 dias.', alertas: [], dias: [] };
    }

    const entrada = {
      hoje: agora.toISOString().slice(0, 10),
      obrigacoes: obrigacoes.map((o) => ({
        obrigacao: o.titulo,
        cliente: o.client.razaoSocial,
        competencia: o.competencia,
        prazo: o.prazo.toISOString().slice(0, 10),
        status: o.status,
        atrasada: o.prazo < agora,
      })),
      compromissos: compromissos.map((c) => ({
        titulo: c.titulo,
        cliente: c.client.razaoSocial,
        inicio: c.inicio.toISOString(),
      })),
    };

    const texto = await this.assistente.completar(SYSTEM_PLANO, JSON.stringify(entrada), { json: true });
    try {
      return JSON.parse(texto);
    } catch {
      return { resumo: texto, alertas: [], dias: [] };
    }
  }
}
