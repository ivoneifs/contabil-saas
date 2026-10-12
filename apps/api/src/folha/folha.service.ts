import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Funcionario, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultasService } from '../consultas/consultas.service';
import { EsocialService } from './esocial.service';
import { calcularFolha, decimoTerceiro, ferias, r2, rescisao, ResultadoFolha, TipoRescisao, Aviso } from './motor';
import { tabelasDe, TABELAS } from './tabelas';

export interface Lancamentos {
  horasExtras50: number;
  horasExtras100: number;
  faltasDias: number;
  outrosProventos: { descricao: string; valor: number; tributavel?: boolean }[];
  outrosDescontos: { descricao: string; valor: number }[];
}

const LANCAMENTOS_VAZIOS: Lancamentos = { horasExtras50: 0, horasExtras100: 0, faltasDias: 0, outrosProventos: [], outrosDescontos: [] };

const intervaloMes = (competencia: string) => {
  const [ano, mes] = competencia.split('-').map(Number);
  return { inicio: new Date(Date.UTC(ano, mes - 1, 1)), fim: new Date(Date.UTC(ano, mes, 0)) };
};

// Vencimento no dia 20 do mês seguinte, antecipado se não for dia útil.
function dia20Seguinte(competencia: string, feriados: Set<string>) {
  const [ano, mes] = competencia.split('-').map(Number);
  const d = new Date(Date.UTC(ano, mes, 20));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6 || feriados.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

@Injectable()
export class FolhaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consultas: ConsultasService,
    private readonly esocial: EsocialService,
  ) {}

  tabelas() {
    return Object.values(TABELAS);
  }

  private async feriados(competencia: string) {
    try {
      return new Set((await this.consultas.feriados(Number(competencia.slice(0, 4)))).map((f) => f.date));
    } catch {
      return new Set<string>();
    }
  }

  private calcularItem(f: Funcionario, competencia: string, l: Lancamentos, feriados: Set<string>): ResultadoFolha {
    return calcularFolha(
      {
        competencia,
        vinculo: f.vinculo,
        salarioBase: Number(f.salarioBase),
        jornadaMensal: f.jornadaMensal,
        admissao: f.dataAdmissao,
        desligamento: f.dataDemissao,
        dependentes: f.dependentesIrrf,
        valeTransporte: f.valeTransporte,
        pensao: f.pensaoAlimenticia ? Number(f.pensaoAlimenticia) : 0,
        ...l,
      },
      tabelasDe(competencia),
      feriados,
    );
  }

  private dadosItem(r: ResultadoFolha) {
    return {
      resultado: r as unknown as Prisma.InputJsonValue,
      bruto: r.bruto,
      inss: r.inss,
      irrf: r.irrf.imposto,
      fgts: r.fgts,
      liquido: r.liquido,
    };
  }

  private async atualizarTotais(folhaId: string) {
    const s = await this.prisma.itemFolha.aggregate({
      where: { folhaId },
      _sum: { bruto: true, inss: true, irrf: true, fgts: true, liquido: true },
    });
    await this.prisma.folhaPagamento.update({
      where: { id: folhaId },
      data: {
        totalBruto: s._sum.bruto ?? 0,
        totalInss: s._sum.inss ?? 0,
        totalIrrf: s._sum.irrf ?? 0,
        totalFgts: s._sum.fgts ?? 0,
        totalLiquido: s._sum.liquido ?? 0,
      },
    });
  }

  private async obter(organizationId: string, id: string) {
    const folha = await this.prisma.folhaPagamento.findFirst({ where: { id, organizationId } });
    if (!folha) throw new NotFoundException('Folha não encontrada.');
    return folha;
  }

  private exigirAberta(status: string) {
    if (status !== 'ABERTA') throw new BadRequestException('Folha fechada. Reabra para alterar.');
  }

  // Abre (ou reabre a tela de) a folha da competência, incluindo quem
  // trabalhou no mês e recalculando tudo.
  async abrir(organizationId: string, clientId: string, competencia: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia)) throw new BadRequestException('Competência deve ser AAAA-MM.');
    const client = await this.prisma.client.findFirst({ where: { id: clientId, organizationId } });
    if (!client) throw new NotFoundException('Cliente não encontrado.');

    const folha = await this.prisma.folhaPagamento.upsert({
      where: { clientId_competencia: { clientId, competencia } },
      create: { organizationId, clientId, competencia },
      update: {},
    });
    if (folha.status === 'ABERTA') await this.sincronizar(folha.id, organizationId, clientId, competencia);
    return this.detalhe(organizationId, folha.id);
  }

  private async sincronizar(folhaId: string, organizationId: string, clientId: string, competencia: string) {
    const { inicio, fim } = intervaloMes(competencia);
    const [funcionarios, itens, feriados] = await Promise.all([
      this.prisma.funcionario.findMany({
        where: { organizationId, clientId, dataAdmissao: { lte: fim }, OR: [{ dataDemissao: null }, { dataDemissao: { gte: inicio } }] },
      }),
      this.prisma.itemFolha.findMany({ where: { folhaId } }),
      this.feriados(competencia),
    ]);
    const porFuncionario = new Map(itens.map((i) => [i.funcionarioId, i]));
    for (const f of funcionarios) {
      const l = (porFuncionario.get(f.id)?.lancamentos as unknown as Lancamentos) ?? LANCAMENTOS_VAZIOS;
      const dados = this.dadosItem(this.calcularItem(f, competencia, l, feriados));
      await this.prisma.itemFolha.upsert({
        where: { folhaId_funcionarioId: { folhaId, funcionarioId: f.id } },
        create: { folhaId, funcionarioId: f.id, lancamentos: l as unknown as Prisma.InputJsonValue, ...dados },
        update: dados,
      });
    }
    // Remove quem não pertence mais à competência (ex.: admissão corrigida).
    const ativos = new Set(funcionarios.map((f) => f.id));
    const sobrando = itens.filter((i) => !ativos.has(i.funcionarioId)).map((i) => i.id);
    if (sobrando.length) await this.prisma.itemFolha.deleteMany({ where: { id: { in: sobrando } } });
    await this.atualizarTotais(folhaId);
  }

  listar(organizationId: string, filtros: { competencia?: string; clientId?: string }) {
    return this.prisma.folhaPagamento.findMany({
      where: { organizationId, ...(filtros.competencia ? { competencia: filtros.competencia } : {}), ...(filtros.clientId ? { clientId: filtros.clientId } : {}) },
      orderBy: [{ competencia: 'desc' }, { createdAt: 'desc' }],
      take: 300,
      include: { client: { select: { razaoSocial: true, cnpjCpf: true } }, _count: { select: { itens: true } } },
    });
  }

  async detalhe(organizationId: string, id: string) {
    const folha = await this.prisma.folhaPagamento.findFirst({
      where: { id, organizationId },
      include: {
        client: { select: { id: true, razaoSocial: true, cnpjCpf: true, municipio: true, uf: true } },
        itens: {
          include: { funcionario: { select: { id: true, nome: true, cpf: true, cargo: true, cbo: true, matricula: true, vinculo: true, salarioBase: true, dataAdmissao: true, dependentesIrrf: true } } },
          orderBy: { funcionario: { nome: 'asc' } },
        },
      },
    });
    if (!folha) throw new NotFoundException('Folha não encontrada.');
    return { ...folha, fontes: tabelasDe(folha.competencia).fontes };
  }

  async atualizarItem(organizationId: string, folhaId: string, itemId: string, l: Lancamentos) {
    const folha = await this.obter(organizationId, folhaId);
    this.exigirAberta(folha.status);
    const item = await this.prisma.itemFolha.findFirst({ where: { id: itemId, folhaId }, include: { funcionario: true } });
    if (!item) throw new NotFoundException('Item não encontrado.');
    const lanc: Lancamentos = {
      horasExtras50: Math.max(Number(l.horasExtras50) || 0, 0),
      horasExtras100: Math.max(Number(l.horasExtras100) || 0, 0),
      faltasDias: Math.min(Math.max(Number(l.faltasDias) || 0, 0), 30),
      outrosProventos: (l.outrosProventos ?? []).filter((p) => p.descricao && Number(p.valor) > 0).map((p) => ({ descricao: p.descricao.slice(0, 60), valor: Number(p.valor), tributavel: p.tributavel !== false })),
      outrosDescontos: (l.outrosDescontos ?? []).filter((p) => p.descricao && Number(p.valor) > 0).map((p) => ({ descricao: p.descricao.slice(0, 60), valor: Number(p.valor) })),
    };
    const r = this.calcularItem(item.funcionario, folha.competencia, lanc, await this.feriados(folha.competencia));
    await this.prisma.itemFolha.update({ where: { id: itemId }, data: { lancamentos: lanc as unknown as Prisma.InputJsonValue, ...this.dadosItem(r) } });
    await this.atualizarTotais(folhaId);
    return this.detalhe(organizationId, folhaId);
  }

  async recalcular(organizationId: string, id: string) {
    const folha = await this.obter(organizationId, id);
    this.exigirAberta(folha.status);
    await this.sincronizar(id, organizationId, folha.clientId, folha.competencia);
    return this.detalhe(organizationId, id);
  }

  async fechar(organizationId: string, id: string) {
    const folha = await this.obter(organizationId, id);
    this.exigirAberta(folha.status);
    const itens = await this.prisma.itemFolha.findMany({ where: { folhaId: id }, include: { funcionario: { select: { id: true, nome: true } } } });
    if (!itens.length) throw new BadRequestException('A folha não tem ninguém. Cadastre os funcionários do cliente.');
    await this.prisma.folhaPagamento.update({ where: { id }, data: { status: 'FECHADA', fechadaEm: new Date() } });
    await this.esocial.folhaFechada(folha, itens.map((i) => i.funcionario));
    return this.detalhe(organizationId, id);
  }

  async reabrir(organizationId: string, id: string) {
    await this.obter(organizationId, id);
    await this.prisma.folhaPagamento.update({ where: { id }, data: { status: 'ABERTA', fechadaEm: null } });
    return this.detalhe(organizationId, id);
  }

  async excluir(organizationId: string, id: string) {
    const folha = await this.obter(organizationId, id);
    this.exigirAberta(folha.status);
    await this.prisma.folhaPagamento.delete({ where: { id } });
    return { ok: true };
  }

  // INSS e FGTS da competência por cliente, a partir das folhas.
  async encargos(organizationId: string, competencia: string) {
    const [folhas, feriados] = await Promise.all([
      this.prisma.folhaPagamento.findMany({
        where: { organizationId, competencia },
        include: {
          client: { select: { id: true, razaoSocial: true, regimeTributario: true } },
          itens: { include: { funcionario: { select: { nome: true, vinculo: true } } } },
        },
      }),
      this.feriados(competencia),
    ]);
    const vencimento = dia20Seguinte(competencia, feriados);
    return {
      competencia,
      vencimentoFgts: vencimento,
      vencimentoInss: vencimento,
      clientes: folhas.map((f) => {
        const res = f.itens.map((i) => ({ i, r: i.resultado as unknown as ResultadoFolha }));
        const empregados = res.filter(({ i }) => i.funcionario.vinculo !== 'SOCIO');
        const socios = res.filter(({ i }) => i.funcionario.vinculo === 'SOCIO');
        const baseEmpregados = r2(empregados.reduce((s, { r }) => s + r.baseInss, 0));
        const baseSocios = r2(socios.reduce((s, { r }) => s + r.baseInss, 0));
        const lucro = f.client.regimeTributario === 'LUCRO_PRESUMIDO' || f.client.regimeTributario === 'LUCRO_REAL';
        // Estimativa da cota patronal (20% + RAT 2% + terceiros 5,8%) só para
        // Lucro Presumido/Real; no Simples (exceto anexo IV) já está no DAS.
        const patronal = lucro ? r2(baseEmpregados * 0.2 + baseSocios * 0.2) : 0;
        const rat = lucro ? r2(baseEmpregados * 0.02) : 0;
        const terceiros = lucro ? r2(baseEmpregados * 0.058) : 0;
        const segurados = r2(res.reduce((s, { r }) => s + r.inss, 0));
        return {
          folhaId: f.id,
          status: f.status,
          cliente: f.client,
          pessoas: f.itens.length,
          baseInss: r2(baseEmpregados + baseSocios),
          inssSegurados: segurados,
          inssPatronal: patronal,
          rat,
          terceiros,
          totalInss: r2(segurados + patronal + rat + terceiros),
          estimativaPatronal: lucro,
          baseFgts: r2(res.reduce((s, { r }) => s + r.baseFgts, 0)),
          fgts: r2(res.reduce((s, { r }) => s + r.fgts, 0)),
          porPessoa: res.map(({ i, r }) => ({ nome: i.funcionario.nome, vinculo: i.funcionario.vinculo, baseInss: r.baseInss, inss: r.inss, baseFgts: r.baseFgts, fgts: r.fgts })),
        };
      }),
    };
  }

  // ---------- Férias, rescisão e 13º ----------

  async calcular(
    organizationId: string,
    funcionarioId: string,
    tipo: 'FERIAS' | 'RESCISAO' | 'DECIMO_TERCEIRO',
    p: Record<string, unknown>,
    salvar: boolean,
  ) {
    const f = await this.prisma.funcionario.findFirst({ where: { id: funcionarioId, organizationId } });
    if (!f) throw new NotFoundException('Funcionário não encontrado.');
    const hoje = new Date().toISOString().slice(0, 7);
    const t = tabelasDe(hoje);
    const salario = Number(p.salarioBase ?? f.salarioBase);
    const media = Number(p.mediaVariaveis ?? 0);
    const data = (v: unknown) => new Date(`${String(v).slice(0, 10)}T00:00:00Z`);

    let resultado: unknown;
    let liquido: number;
    if (tipo === 'FERIAS') {
      const r = ferias({ salarioBase: salario, mediaVariaveis: media, dias: Number(p.dias ?? 30), abonoDias: Number(p.abonoDias ?? 0), dependentes: f.dependentesIrrf }, t);
      resultado = r;
      liquido = r.liquido;
    } else if (tipo === 'DECIMO_TERCEIRO') {
      const r = decimoTerceiro(
        {
          salarioBase: salario,
          mediaVariaveis: media,
          admissao: f.dataAdmissao,
          ano: Number(p.ano ?? new Date().getFullYear()),
          dependentes: f.dependentesIrrf,
          parcelaPaga: p.parcelaPaga !== undefined && p.parcelaPaga !== '' ? Number(p.parcelaPaga) : undefined,
        },
        t,
        p.parcela === 'PRIMEIRA' ? 'PRIMEIRA' : 'SEGUNDA',
      );
      resultado = r;
      liquido = r.liquido;
    } else {
      if (!p.desligamento) throw new BadRequestException('Informe a data do desligamento.');
      const r = rescisao(
        {
          tipo: (p.tipoRescisao as TipoRescisao) ?? 'SEM_JUSTA_CAUSA',
          aviso: (p.aviso as Aviso) ?? 'INDENIZADO',
          salarioBase: salario,
          mediaVariaveis: media,
          admissao: f.dataAdmissao,
          desligamento: data(p.desligamento),
          feriasVencidasPeriodos: Number(p.feriasVencidas ?? 0),
          saldoFgts: Number(p.saldoFgts ?? 0),
          dependentes: f.dependentesIrrf,
        },
        t,
      );
      resultado = r;
      liquido = r.liquido;
    }

    if (!salvar) return { resultado, salvo: null };
    const salvo = await this.prisma.calculoTrabalhista.create({
      data: {
        organizationId,
        funcionarioId,
        tipo,
        parametros: p as Prisma.InputJsonValue,
        resultado: resultado as Prisma.InputJsonValue,
        liquido,
      },
    });
    // Rescisão salva: registra o desligamento no cadastro (gera o S-2299).
    if (tipo === 'RESCISAO' && !f.dataDemissao) {
      const atualizado = await this.prisma.funcionario.update({ where: { id: f.id }, data: { dataDemissao: data(p.desligamento) } });
      await this.esocial.desligamento({ ...atualizado, dataDemissao: atualizado.dataDemissao! });
    }
    return { resultado, salvo: { id: salvo.id } };
  }

  listarCalculos(organizationId: string, filtros: { funcionarioId?: string; tipo?: string }) {
    return this.prisma.calculoTrabalhista.findMany({
      where: {
        organizationId,
        ...(filtros.funcionarioId ? { funcionarioId: filtros.funcionarioId } : {}),
        ...(filtros.tipo ? { tipo: filtros.tipo as 'FERIAS' | 'RESCISAO' | 'DECIMO_TERCEIRO' } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { funcionario: { select: { nome: true, cpf: true, client: { select: { razaoSocial: true } } } } },
    });
  }

  async obterCalculo(organizationId: string, id: string) {
    const c = await this.prisma.calculoTrabalhista.findFirst({
      where: { id, organizationId },
      include: { funcionario: { include: { client: { select: { razaoSocial: true, cnpjCpf: true } } } } },
    });
    if (!c) throw new NotFoundException('Cálculo não encontrado.');
    return c;
  }

  async excluirCalculo(organizationId: string, id: string) {
    await this.prisma.calculoTrabalhista.deleteMany({ where: { id, organizationId } });
    return { ok: true };
  }
}
