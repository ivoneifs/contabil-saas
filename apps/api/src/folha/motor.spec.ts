import { TABELAS } from './tabelas';
import { avos, avos13, calcularFolha, decimoTerceiro, diasTrabalhadosNoMes, ferias, inssContribuinteIndividual, inssEmpregado, irrf, rescisao } from './motor';

const t = TABELAS[2026];
const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe('INSS 2026', () => {
  it('progressivo por faixa', () => {
    expect(inssEmpregado(1621, t)).toBe(121.58);
    expect(inssEmpregado(3000, t)).toBe(248.6);
    expect(inssEmpregado(6000, t)).toBe(641.51);
  });
  it('limitado ao teto (R$ 988,09)', () => {
    expect(inssEmpregado(8475.55, t)).toBe(988.09);
    expect(inssEmpregado(20000, t)).toBe(988.09);
  });
  it('contribuinte individual 11% até o teto', () => {
    expect(inssContribuinteIndividual(5000, t)).toBe(550);
    expect(inssContribuinteIndividual(15000, t)).toBe(932.31);
  });
});

describe('IRRF 2026 com a redução da Lei 15.270', () => {
  it('isento na prática até R$ 5.000', () => {
    // INSS (368,60) < desconto simplificado (607,20): usa o simplificado.
    const r = irrf(4000, t, { inss: inssEmpregado(4000, t) });
    expect(r.usouSimplificado).toBe(true);
    expect(r.impostoTabela).toBe(114.76);
    expect(r.reducao).toBe(114.76);
    expect(r.imposto).toBe(0);
  });
  it('redução parcial entre R$ 5.000 e R$ 7.350', () => {
    const r = irrf(6000, t, { inss: 641.51 });
    expect(r.base).toBe(5358.49);
    expect(r.impostoTabela).toBe(564.85);
    expect(r.reducao).toBe(179.75); // 978,62 − 0,133145 × 6.000
    expect(r.imposto).toBe(385.1);
  });
  it('sem redução acima de R$ 7.350', () => {
    const r = irrf(8000, t, { inss: inssEmpregado(8000, t), dependentes: 1 });
    expect(r.reducao).toBe(0);
    expect(r.imposto).toBeGreaterThan(900);
  });
  it('usa o desconto simplificado quando é melhor', () => {
    const r = irrf(3000, t, { inss: 50 });
    expect(r.usouSimplificado).toBe(true);
    expect(r.deducao).toBe(607.2);
  });
});

describe('datas', () => {
  it('dias trabalhados no mês de admissão (mês comercial)', () => {
    expect(diasTrabalhadosNoMes('2026-09', d('2026-09-15'))).toBe(16);
    expect(diasTrabalhadosNoMes('2026-09', d('2025-01-10'))).toBe(30);
    expect(diasTrabalhadosNoMes('2026-02', d('2025-01-10'))).toBe(30);
    expect(diasTrabalhadosNoMes('2026-09', d('2025-01-10'), d('2026-09-10'))).toBe(10);
    expect(diasTrabalhadosNoMes('2026-09', d('2026-10-01'))).toBe(0);
  });
  it('avos com regra dos 15 dias', () => {
    expect(avos(d('2024-03-01'), d('2026-09-30'))).toBe(31);
    expect(avos13(2026, d('2026-03-20'), d('2026-12-31'))).toBe(9); // março: 12 dias
    expect(avos13(2026, d('2026-03-10'), d('2026-12-31'))).toBe(10);
    expect(avos13(2026, d('2026-03-18'), d('2026-12-31'))).toBe(9);
  });
});

describe('folha mensal', () => {
  const base = {
    competencia: '2026-09',
    vinculo: 'EMPREGADO' as const,
    salarioBase: 3000,
    jornadaMensal: 220,
    admissao: d('2025-01-10'),
    dependentes: 0,
    valeTransporte: true,
    horasExtras50: 10,
    horasExtras100: 0,
    faltasDias: 0,
    outrosProventos: [],
    outrosDescontos: [],
  };

  it('horas extras com DSR, INSS, IRRF, VT e FGTS', () => {
    const r = calcularFolha(base, t, new Set(['2026-09-07']));
    const he = r.rubricas.find((x) => x.codigo === '0010')!;
    const dsr = r.rubricas.find((x) => x.codigo === '0012')!;
    expect(he.provento).toBe(204.55);
    expect(dsr.provento).toBe(40.91); // 5 domingos/feriados, 25 dias úteis
    expect(r.baseInss).toBe(3245.46);
    expect(r.inss).toBe(inssEmpregado(3245.46, t));
    expect(r.irrf.imposto).toBe(0);
    expect(r.rubricas.find((x) => x.codigo === '0230')!.desconto).toBe(180);
    expect(r.fgts).toBe(259.64);
    expect(r.liquido).toBe(Math.round((r.bruto - r.inss - 180) * 100) / 100);
  });

  it('pró-labore de sócio: 11% de INSS, sem FGTS e sem horas extras', () => {
    const r = calcularFolha({ ...base, vinculo: 'SOCIO', salarioBase: 5000, valeTransporte: false }, t);
    expect(r.inss).toBe(550);
    expect(r.fgts).toBe(0);
    expect(r.rubricas.some((x) => x.codigo === '0010')).toBe(false);
  });

  it('aprendiz: FGTS de 2%', () => {
    const r = calcularFolha({ ...base, vinculo: 'APRENDIZ', salarioBase: 1621, horasExtras50: 0, valeTransporte: false }, t);
    expect(r.fgts).toBe(32.42);
  });

  it('estagiário: sem INSS e sem FGTS', () => {
    const r = calcularFolha({ ...base, vinculo: 'ESTAGIARIO', salarioBase: 1500, horasExtras50: 0, valeTransporte: false }, t);
    expect(r.inss).toBe(0);
    expect(r.fgts).toBe(0);
  });

  it('faltas reduzem a base', () => {
    const r = calcularFolha({ ...base, horasExtras50: 0, valeTransporte: false, faltasDias: 2 }, t);
    expect(r.rubricas.find((x) => x.codigo === '0100')!.desconto).toBe(200);
    expect(r.baseInss).toBe(2800);
  });
});

describe('13º, férias e rescisão', () => {
  it('13º: 1ª parcela sem descontos e 2ª com INSS e IRRF', () => {
    const p1 = decimoTerceiro({ salarioBase: 3000, admissao: d('2025-01-10'), ano: 2026, dependentes: 0 }, t, 'PRIMEIRA');
    expect(p1.total).toBe(3000);
    expect(p1.valor).toBe(1500);
    const p2 = decimoTerceiro({ salarioBase: 3000, admissao: d('2025-01-10'), ano: 2026, dependentes: 0 }, t, 'SEGUNDA');
    expect(p2.inss).toBe(248.6);
    expect(p2.liquido).toBe(Math.round((1500 - 248.6 - p2.irrf) * 100) / 100);
  });

  it('férias de 30 dias com 1/3', () => {
    const r = ferias({ salarioBase: 3000, dias: 30, dependentes: 0 }, t);
    expect(r.bruto).toBe(4000);
    expect(r.inss).toBe(inssEmpregado(4000, t));
    expect(r.irrf).toBe(0);
  });

  it('férias com abono pecuniário isento', () => {
    const r = ferias({ salarioBase: 3000, dias: 20, abonoDias: 10, dependentes: 0 }, t);
    expect(r.bruto).toBe(4000);
    expect(r.inss).toBe(inssEmpregado(2666.67, t));
  });

  it('rescisão sem justa causa com aviso indenizado e projeção', () => {
    const r = rescisao(
      { tipo: 'SEM_JUSTA_CAUSA', aviso: 'INDENIZADO', salarioBase: 3000, admissao: d('2024-03-01'), desligamento: d('2026-09-30'), feriasVencidasPeriodos: 0, saldoFgts: 5000, dependentes: 0 },
      t,
    );
    const v = (c: string) => r.rubricas.find((x) => x.codigo === c);
    expect(r.diasAviso).toBe(36);
    expect(r.dataProjetada).toBe('2026-11-05');
    expect(v('0001')!.provento).toBe(3000);
    expect(v('0400')!.provento).toBe(3600);
    expect(v('0410')!.provento).toBe(2500); // 10/12
    expect(v('0425')!.provento).toBe(2000); // 8/12
    expect(v('0426')!.provento).toBe(666.67);
    expect(r.fgts.percentualMulta).toBe(0.4);
    expect(r.fgts.multa).toBe(Math.round((5000 + r.fgts.depositoMes) * 0.4 * 100) / 100);
    expect(r.prazoPagamento).toBe('2026-10-10');
  });

  it('justa causa: só saldo e férias vencidas', () => {
    const r = rescisao(
      { tipo: 'JUSTA_CAUSA', aviso: 'DISPENSADO', salarioBase: 3000, admissao: d('2024-03-01'), desligamento: d('2026-09-15'), feriasVencidasPeriodos: 1, saldoFgts: 5000, dependentes: 0 },
      t,
    );
    const codigos = r.rubricas.map((x) => x.codigo);
    expect(codigos).not.toContain('0410');
    expect(codigos).not.toContain('0425');
    expect(codigos).toContain('0420');
    expect(r.fgts.multa).toBe(0);
  });

  it('acordo (art. 484-A): metade do aviso e multa de 20%', () => {
    const r = rescisao(
      { tipo: 'ACORDO', aviso: 'INDENIZADO', salarioBase: 3000, admissao: d('2024-03-01'), desligamento: d('2026-09-30'), feriasVencidasPeriodos: 0, saldoFgts: 5000, dependentes: 0 },
      t,
    );
    expect(r.rubricas.find((x) => x.codigo === '0400')!.referencia).toBe('18 dias');
    expect(r.fgts.percentualMulta).toBe(0.2);
  });
});
