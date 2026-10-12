import { TabelasAno } from './tabelas';

// Motor de cálculo trabalhista. Funções puras: recebem valores e tabelas,
// devolvem rubricas. Mês comercial de 30 dias (prática da CLT para salário mensal).

// Arredonda para centavos com meio centavo para cima (121,575 → 121,58),
// corrigindo o erro de ponto flutuante antes de arredondar.
export const r2 = (v: number) => Math.round(Number((v * 100).toFixed(6))) / 100;

const moeda = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type Vinculo = 'EMPREGADO' | 'APRENDIZ' | 'SOCIO' | 'ESTAGIARIO';

export interface Rubrica {
  codigo: string;
  descricao: string;
  referencia?: string;
  provento?: number;
  desconto?: number;
}

// ---------- INSS ----------

// Progressivo por faixa, limitado ao teto.
export function inssEmpregado(base: number, t: TabelasAno): number {
  let restante = Math.min(Math.max(base, 0), t.inss.teto);
  let anterior = 0;
  let total = 0;
  for (const f of t.inss.faixas) {
    const limite = f.ate ?? Infinity;
    const naFaixa = Math.min(restante, limite - anterior);
    if (naFaixa <= 0) break;
    total += naFaixa * f.aliquota;
    restante -= naFaixa;
    anterior = limite;
  }
  return r2(total);
}

// Sócio (pró-labore) e autônomos: 11% retidos pela empresa, até o teto.
export function inssContribuinteIndividual(base: number, t: TabelasAno): number {
  return r2(Math.min(Math.max(base, 0), t.inss.teto) * t.inss.contribuinteIndividual);
}

// ---------- IRRF ----------

export interface ResultadoIrrf {
  base: number;
  deducao: number;
  usouSimplificado: boolean;
  impostoTabela: number;
  reducao: number;
  imposto: number;
  aliquota: number;
}

// rendimentos: rendimentos tributáveis brutos do mês (base também do redutor
// da Lei 15.270). deducoesLegais: INSS + dependentes + pensão alimentícia.
// Usa o desconto simplificado quando for mais vantajoso.
export function irrf(
  rendimentos: number,
  t: TabelasAno,
  opcoes: { inss: number; dependentes?: number; pensao?: number; aplicarReducao?: boolean },
): ResultadoIrrf {
  const legais = opcoes.inss + (opcoes.dependentes ?? 0) * t.irrf.dependente + (opcoes.pensao ?? 0);
  const usouSimplificado = t.irrf.descontoSimplificado > legais;
  const deducao = usouSimplificado ? t.irrf.descontoSimplificado : legais;
  const base = r2(Math.max(rendimentos - deducao, 0));
  const faixa = t.irrf.faixas.find((f) => f.ate === null || base <= f.ate)!;
  const impostoTabela = r2(Math.max(base * faixa.aliquota - (faixa.deduzir ?? 0), 0));

  let reducao = 0;
  const red = t.irrf.reducao;
  if (red && opcoes.aplicarReducao !== false && impostoTabela > 0) {
    if (rendimentos <= red.isencaoAte) reducao = Math.min(impostoTabela, red.reducaoMaxima);
    else if (rendimentos < red.ate) reducao = Math.min(impostoTabela, Math.max(red.constante - red.fator * rendimentos, 0));
  }
  reducao = r2(reducao);
  return { base, deducao: r2(deducao), usouSimplificado, impostoTabela, reducao, imposto: r2(impostoTabela - reducao), aliquota: faixa.aliquota };
}

// ---------- Datas ----------

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const diasNoMes = (ano: number, mes0: number) => new Date(Date.UTC(ano, mes0 + 1, 0)).getUTCDate();

// Dias a pagar na competência (mês comercial de 30), considerando admissão
// e desligamento dentro do mês.
export function diasTrabalhadosNoMes(competencia: string, admissao: Date, desligamento?: Date | null): number {
  const [ano, mes] = competencia.split('-').map(Number);
  const ini = new Date(Date.UTC(ano, mes - 1, 1));
  const ultimo = diasNoMes(ano, mes - 1);
  const fim = new Date(Date.UTC(ano, mes - 1, ultimo));
  if (admissao > fim || (desligamento && desligamento < ini)) return 0;
  const de = admissao > ini ? admissao.getUTCDate() : 1;
  const ate = desligamento && desligamento <= fim ? desligamento.getUTCDate() : ultimo;
  if (de === 1 && ate === ultimo) return 30;
  // Fevereiro/meses de 31: mês "cheio" a partir do dia de entrada conta até o 30.
  const ateComercial = ate === ultimo ? 30 : ate;
  return Math.max(ateComercial - de + 1, 0);
}

// Domingos e feriados x dias úteis do mês (para o DSR sobre variáveis).
export function calendarioDsr(competencia: string, feriados: Set<string>) {
  const [ano, mes] = competencia.split('-').map(Number);
  let descanso = 0;
  let uteis = 0;
  for (let d = 1; d <= diasNoMes(ano, mes - 1); d++) {
    const data = new Date(Date.UTC(ano, mes - 1, d));
    if (data.getUTCDay() === 0 || feriados.has(ymd(data))) descanso++;
    else uteis++;
  }
  return { descanso, uteis };
}

// Meses com 15 dias ou mais trabalhados entre duas datas (avos).
export function avos(inicio: Date, fim: Date): number {
  if (fim < inicio) return 0;
  let total = 0;
  let cursor = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate()));
  while (cursor <= fim) {
    const proximo = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate()));
    const fimPeriodo = new Date(proximo.getTime() - 86400000);
    if (fimPeriodo <= fim) total++;
    else if ((fim.getTime() - cursor.getTime()) / 86400000 + 1 >= 15) total++;
    cursor = proximo;
  }
  return total;
}

// Avos do 13º no ano: meses do calendário com 15+ dias trabalhados.
export function avos13(ano: number, admissao: Date, ate: Date): number {
  let total = 0;
  for (let m = 0; m < 12; m++) {
    const ini = new Date(Date.UTC(ano, m, 1));
    const fim = new Date(Date.UTC(ano, m, diasNoMes(ano, m)));
    const de = admissao > ini ? admissao : ini;
    const para = ate < fim ? ate : fim;
    if (para < de) continue;
    if ((para.getTime() - de.getTime()) / 86400000 + 1 >= 15) total++;
  }
  return total;
}

// ---------- Folha mensal ----------

export interface EntradaFolha {
  competencia: string;
  vinculo: Vinculo;
  salarioBase: number;
  jornadaMensal: number; // horas (220 padrão)
  admissao: Date;
  desligamento?: Date | null;
  dependentes: number;
  valeTransporte: boolean;
  horasExtras50: number;
  horasExtras100: number;
  faltasDias: number;
  outrosProventos: { descricao: string; valor: number; tributavel?: boolean }[];
  outrosDescontos: { descricao: string; valor: number }[];
  pensao?: number;
}

export interface ResultadoFolha {
  rubricas: Rubrica[];
  bruto: number;
  baseInss: number;
  inss: number;
  baseIrrf: number;
  irrf: ResultadoIrrf;
  baseFgts: number;
  fgts: number;
  descontos: number;
  liquido: number;
  diasTrabalhados: number;
}

export function calcularFolha(e: EntradaFolha, t: TabelasAno, feriados: Set<string> = new Set()): ResultadoFolha {
  const rubricas: Rubrica[] = [];
  const dias = diasTrabalhadosNoMes(e.competencia, e.admissao, e.desligamento);
  const salario = r2((e.salarioBase / 30) * dias);
  const ehSocio = e.vinculo === 'SOCIO';
  rubricas.push({ codigo: ehSocio ? '0002' : '0001', descricao: ehSocio ? 'Pró-labore' : 'Salário', referencia: `${dias} dias`, provento: salario });

  const valorHora = e.salarioBase / (e.jornadaMensal || 220);
  let variaveis = 0;
  if (e.horasExtras50 > 0 && !ehSocio) {
    const v = r2(valorHora * 1.5 * e.horasExtras50);
    variaveis += v;
    rubricas.push({ codigo: '0010', descricao: 'Horas extras 50%', referencia: `${e.horasExtras50} h`, provento: v });
  }
  if (e.horasExtras100 > 0 && !ehSocio) {
    const v = r2(valorHora * 2 * e.horasExtras100);
    variaveis += v;
    rubricas.push({ codigo: '0011', descricao: 'Horas extras 100%', referencia: `${e.horasExtras100} h`, provento: v });
  }
  if (variaveis > 0) {
    const { descanso, uteis } = calendarioDsr(e.competencia, feriados);
    const dsr = r2((variaveis / Math.max(uteis, 1)) * descanso);
    rubricas.push({ codigo: '0012', descricao: 'DSR sobre horas extras', referencia: `${descanso}/${uteis}`, provento: dsr });
    variaveis += dsr;
  }

  let outrosTributaveis = 0;
  let outrosIsentos = 0;
  for (const p of e.outrosProventos.filter((x) => x.valor > 0)) {
    const v = r2(p.valor);
    if (p.tributavel === false) outrosIsentos += v;
    else outrosTributaveis += v;
    rubricas.push({ codigo: '0050', descricao: p.descricao, provento: v });
  }

  let faltas = 0;
  if (e.faltasDias > 0 && !ehSocio) {
    faltas = r2((e.salarioBase / 30) * e.faltasDias);
    rubricas.push({ codigo: '0100', descricao: 'Faltas', referencia: `${e.faltasDias} dias`, desconto: faltas });
  }

  const bruto = r2(salario + variaveis + outrosTributaveis + outrosIsentos);
  const tributavel = r2(salario + variaveis + outrosTributaveis - faltas);

  // INSS
  const semInss = e.vinculo === 'ESTAGIARIO';
  const baseInss = semInss ? 0 : Math.max(tributavel, 0);
  const inss = semInss ? 0 : ehSocio ? inssContribuinteIndividual(baseInss, t) : inssEmpregado(baseInss, t);
  if (inss > 0) rubricas.push({ codigo: '0200', descricao: ehSocio ? 'INSS contribuinte individual 11%' : 'INSS', referencia: `base ${moeda(baseInss)}`, desconto: inss });

  // IRRF
  const ir = irrf(Math.max(tributavel, 0), t, { inss, dependentes: e.dependentes, pensao: e.pensao });
  if (ir.imposto > 0) rubricas.push({ codigo: '0210', descricao: 'IRRF', referencia: `${(ir.aliquota * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`, desconto: ir.imposto });
  if (e.pensao && e.pensao > 0) rubricas.push({ codigo: '0220', descricao: 'Pensão alimentícia', desconto: r2(e.pensao) });

  // Vale-transporte: até 6% do salário base proporcional.
  let vt = 0;
  if (e.valeTransporte && !ehSocio) {
    vt = r2(salario * 0.06);
    rubricas.push({ codigo: '0230', descricao: 'Vale-transporte 6%', desconto: vt });
  }

  let outrosDesc = 0;
  for (const d of e.outrosDescontos.filter((x) => x.valor > 0)) {
    outrosDesc += r2(d.valor);
    rubricas.push({ codigo: '0250', descricao: d.descricao, desconto: r2(d.valor) });
  }

  // FGTS (não é desconto: depósito do empregador)
  const semFgts = ehSocio || e.vinculo === 'ESTAGIARIO';
  const baseFgts = semFgts ? 0 : Math.max(tributavel, 0);
  const fgts = r2(baseFgts * (e.vinculo === 'APRENDIZ' ? t.fgts.aprendiz : t.fgts.padrao));

  const descontos = r2(faltas + inss + ir.imposto + (e.pensao ?? 0) + vt + outrosDesc);
  return {
    rubricas,
    bruto,
    baseInss: r2(baseInss),
    inss,
    baseIrrf: ir.base,
    irrf: ir,
    baseFgts: r2(baseFgts),
    fgts,
    descontos,
    liquido: r2(bruto - descontos),
    diasTrabalhados: dias,
  };
}

// ---------- 13º salário ----------

export function decimoTerceiro(
  e: { salarioBase: number; mediaVariaveis?: number; admissao: Date; ano: number; ate?: Date; dependentes: number; parcelaPaga?: number },
  t: TabelasAno,
  parcela: 'PRIMEIRA' | 'SEGUNDA',
) {
  const fimAno = e.ate ?? new Date(Date.UTC(e.ano, 11, 31));
  const n = avos13(e.ano, e.admissao, fimAno);
  const total = r2(((e.salarioBase + (e.mediaVariaveis ?? 0)) / 12) * n);
  if (parcela === 'PRIMEIRA') {
    const valor = r2(total / 2);
    return { avos: n, total, valor, inss: 0, irrf: 0, liquido: valor, observacao: '1ª parcela sem descontos (paga até 30/11).' };
  }
  const inss = inssEmpregado(total, t);
  // 13º tem tributação exclusiva; a redução da Lei 15.270 incide sobre
  // rendimentos de incidência mensal, por isso não é aplicada aqui.
  const ir = irrf(total, t, { inss, dependentes: e.dependentes, aplicarReducao: false });
  const adiantado = e.parcelaPaga ?? r2(total / 2);
  return {
    avos: n,
    total,
    valor: r2(total - adiantado),
    inss,
    irrf: ir.imposto,
    liquido: r2(total - adiantado - inss - ir.imposto),
    observacao: '2ª parcela (até 20/12): INSS e IRRF sobre o 13º integral, descontada a 1ª parcela.',
  };
}

// ---------- Férias ----------

export function ferias(
  e: { salarioBase: number; mediaVariaveis?: number; dias: number; abonoDias?: number; dependentes: number },
  t: TabelasAno,
) {
  const mensal = e.salarioBase + (e.mediaVariaveis ?? 0);
  const valorFerias = r2((mensal / 30) * e.dias);
  const tercoFerias = r2(valorFerias / 3);
  const abono = r2((mensal / 30) * (e.abonoDias ?? 0));
  const tercoAbono = r2(abono / 3);
  const tributavel = r2(valorFerias + tercoFerias);
  const inss = inssEmpregado(tributavel, t);
  const ir = irrf(tributavel, t, { inss, dependentes: e.dependentes });
  const rubricas: Rubrica[] = [
    { codigo: '0300', descricao: 'Férias', referencia: `${e.dias} dias`, provento: valorFerias },
    { codigo: '0301', descricao: '1/3 constitucional', provento: tercoFerias },
  ];
  if (abono > 0) {
    rubricas.push({ codigo: '0302', descricao: 'Abono pecuniário', referencia: `${e.abonoDias} dias`, provento: abono });
    rubricas.push({ codigo: '0303', descricao: '1/3 sobre abono', provento: tercoAbono });
  }
  if (inss > 0) rubricas.push({ codigo: '0200', descricao: 'INSS', desconto: inss });
  if (ir.imposto > 0) rubricas.push({ codigo: '0210', descricao: 'IRRF', desconto: ir.imposto });
  const bruto = r2(valorFerias + tercoFerias + abono + tercoAbono);
  return { rubricas, bruto, inss, irrf: ir.imposto, liquido: r2(bruto - inss - ir.imposto), observacao: 'Abono pecuniário e seu 1/3 são isentos de INSS e IRRF. Pagamento até 2 dias antes do início.' };
}

// ---------- Rescisão ----------

export type TipoRescisao = 'SEM_JUSTA_CAUSA' | 'PEDIDO_DEMISSAO' | 'JUSTA_CAUSA' | 'ACORDO' | 'TERMINO_CONTRATO';
export type Aviso = 'INDENIZADO' | 'TRABALHADO' | 'NAO_CUMPRIDO' | 'DISPENSADO';

export interface EntradaRescisao {
  tipo: TipoRescisao;
  aviso: Aviso;
  salarioBase: number;
  mediaVariaveis?: number;
  admissao: Date;
  desligamento: Date;
  feriasVencidasPeriodos: number;
  saldoFgts: number;
  dependentes: number;
}

export function rescisao(e: EntradaRescisao, t: TabelasAno) {
  const mensal = e.salarioBase + (e.mediaVariaveis ?? 0);
  const rubricas: Rubrica[] = [];
  const anos = Math.floor(avos(e.admissao, e.desligamento) / 12);

  // Aviso prévio: 30 dias + 3 por ano completo, até 90 (Lei 12.506/2011).
  const diasAviso = Math.min(30 + 3 * anos, 90);
  let avisoIndenizado = 0;
  let descontoAviso = 0;
  let projecao = 0;
  if (e.aviso === 'INDENIZADO' && (e.tipo === 'SEM_JUSTA_CAUSA' || e.tipo === 'ACORDO')) {
    const dias = e.tipo === 'ACORDO' ? Math.floor(diasAviso / 2) : diasAviso;
    avisoIndenizado = r2((mensal / 30) * dias);
    projecao = e.tipo === 'ACORDO' ? dias : diasAviso;
    rubricas.push({ codigo: '0400', descricao: 'Aviso prévio indenizado', referencia: `${dias} dias`, provento: avisoIndenizado });
  }
  if (e.tipo === 'PEDIDO_DEMISSAO' && e.aviso === 'NAO_CUMPRIDO') {
    descontoAviso = r2(e.salarioBase);
    rubricas.push({ codigo: '0450', descricao: 'Aviso prévio não cumprido', referencia: '30 dias', desconto: descontoAviso });
  }
  const dataProjetada = new Date(e.desligamento.getTime() + projecao * 86400000);

  // Saldo de salário
  const diasSaldo = e.desligamento.getUTCDate();
  const saldo = r2((e.salarioBase / 30) * Math.min(diasSaldo, 30));
  rubricas.unshift({ codigo: '0001', descricao: 'Saldo de salário', referencia: `${diasSaldo} dias`, provento: saldo });

  // 13º proporcional (não devido na justa causa)
  let decimo = 0;
  if (e.tipo !== 'JUSTA_CAUSA') {
    const ano = dataProjetada.getUTCFullYear();
    const n = avos13(ano, e.admissao, dataProjetada);
    decimo = r2((mensal / 12) * n);
    if (decimo > 0) rubricas.push({ codigo: '0410', descricao: '13º salário proporcional', referencia: `${n}/12`, provento: decimo });
  }

  // Férias vencidas (sempre devidas) e proporcionais (não na justa causa)
  const vencidas = r2(mensal * e.feriasVencidasPeriodos);
  if (vencidas > 0) {
    rubricas.push({ codigo: '0420', descricao: 'Férias vencidas', referencia: `${e.feriasVencidasPeriodos} período(s)`, provento: vencidas });
    rubricas.push({ codigo: '0421', descricao: '1/3 férias vencidas', provento: r2(vencidas / 3) });
  }
  let proporcionais = 0;
  if (e.tipo !== 'JUSTA_CAUSA') {
    // Período aquisitivo atual: último aniversário da admissão até a data projetada.
    const aniversario = new Date(Date.UTC(dataProjetada.getUTCFullYear(), e.admissao.getUTCMonth(), e.admissao.getUTCDate()));
    const inicioAquisitivo = aniversario > dataProjetada ? new Date(Date.UTC(aniversario.getUTCFullYear() - 1, aniversario.getUTCMonth(), aniversario.getUTCDate())) : aniversario;
    const inicio = inicioAquisitivo < e.admissao ? e.admissao : inicioAquisitivo;
    const n = Math.min(avos(inicio, dataProjetada), 12);
    proporcionais = r2((mensal / 12) * n);
    if (proporcionais > 0) {
      rubricas.push({ codigo: '0425', descricao: 'Férias proporcionais', referencia: `${n}/12`, provento: proporcionais });
      rubricas.push({ codigo: '0426', descricao: '1/3 férias proporcionais', provento: r2(proporcionais / 3) });
    }
  }

  // Descontos: INSS e IRRF sobre saldo de salário e, separados, sobre o 13º.
  // Aviso indenizado e férias indenizadas são isentos (natureza indenizatória).
  const inssSaldo = inssEmpregado(saldo, t);
  const irSaldo = irrf(saldo, t, { inss: inssSaldo, dependentes: e.dependentes });
  const inss13 = inssEmpregado(decimo, t);
  const ir13 = irrf(decimo, t, { inss: inss13, dependentes: e.dependentes, aplicarReducao: false });
  if (inssSaldo > 0) rubricas.push({ codigo: '0200', descricao: 'INSS sobre saldo de salário', desconto: inssSaldo });
  if (inss13 > 0) rubricas.push({ codigo: '0201', descricao: 'INSS sobre 13º', desconto: inss13 });
  if (irSaldo.imposto > 0) rubricas.push({ codigo: '0210', descricao: 'IRRF sobre saldo de salário', desconto: irSaldo.imposto });
  if (ir13.imposto > 0) rubricas.push({ codigo: '0211', descricao: 'IRRF sobre 13º', desconto: ir13.imposto });

  const proventos = r2(rubricas.reduce((s, r) => s + (r.provento ?? 0), 0));
  const descontos = r2(rubricas.reduce((s, r) => s + (r.desconto ?? 0), 0));

  // FGTS: depósito do mês + multa
  const fgtsMes = r2((saldo + avisoIndenizado + decimo) * t.fgts.padrao);
  const percentualMulta = e.tipo === 'SEM_JUSTA_CAUSA' ? 0.4 : e.tipo === 'ACORDO' ? 0.2 : 0;
  const multaFgts = r2((e.saldoFgts + fgtsMes) * percentualMulta);
  const saque = e.tipo === 'SEM_JUSTA_CAUSA' || e.tipo === 'TERMINO_CONTRATO' ? '100% do saldo' : e.tipo === 'ACORDO' ? 'até 80% do saldo' : 'sem saque';

  return {
    rubricas,
    proventos,
    descontos,
    liquido: r2(proventos - descontos),
    diasAviso,
    dataProjetada: ymd(dataProjetada),
    fgts: { depositoMes: fgtsMes, multa: multaFgts, percentualMulta, saque, seguroDesemprego: e.tipo === 'SEM_JUSTA_CAUSA' },
    prazoPagamento: ymd(new Date(e.desligamento.getTime() + 10 * 86400000)),
  };
}
