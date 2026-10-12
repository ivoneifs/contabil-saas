import { RegimeTributario } from '@prisma/client';

// Regras de vencimento das obrigações mais comuns, por regime.
// "competencia" é o mês do fato gerador (AAAA-MM). Os prazos seguem a
// legislação federal vigente; o escritório deve conferir casos especiais
// (substituição tributária, regimes estaduais e municipais).

export type Ajuste = 'antecipa' | 'prorroga';

export interface PerfilCliente {
  regime: RegimeTributario;
  temFuncionarios: boolean;
}

export interface RegraObrigacao {
  titulo: string;
  aplica: (p: PerfilCliente, mesCompetencia: number) => boolean;
  // Vencimento relativo à competência.
  vencimento:
    | { tipo: 'dia'; mesesDepois: number; dia: number; ajuste: Ajuste }
    | { tipo: 'ultimoDiaUtil'; mesesDepois: number }
    | { tipo: 'diaUtil'; mesesDepois: number; n: number };
  fonte: string;
}

const simplesOuMei = (p: PerfilCliente) => p.regime === 'SIMPLES_NACIONAL' || p.regime === 'MEI';
const lucro = (p: PerfilCliente) => p.regime === 'LUCRO_PRESUMIDO' || p.regime === 'LUCRO_REAL';
const fimDeTrimestre = (mes: number) => mes % 3 === 0;

export const REGRAS: RegraObrigacao[] = [
  {
    titulo: 'DAS-MEI',
    aplica: (p) => p.regime === 'MEI',
    vencimento: { tipo: 'dia', mesesDepois: 1, dia: 20, ajuste: 'prorroga' },
    fonte: 'Resolução CGSN 140/2018, art. 40',
  },
  {
    titulo: 'DASN-SIMEI (anual)',
    aplica: (p, mes) => p.regime === 'MEI' && mes === 4,
    vencimento: { tipo: 'dia', mesesDepois: 1, dia: 31, ajuste: 'prorroga' },
    fonte: 'Resolução CGSN 140/2018, art. 109',
  },
  {
    titulo: 'PGDAS-D e DAS',
    aplica: (p) => p.regime === 'SIMPLES_NACIONAL',
    vencimento: { tipo: 'dia', mesesDepois: 1, dia: 20, ajuste: 'prorroga' },
    fonte: 'Resolução CGSN 140/2018, arts. 38 e 40',
  },
  {
    titulo: 'DEFIS (anual)',
    aplica: (p, mes) => p.regime === 'SIMPLES_NACIONAL' && mes === 2,
    vencimento: { tipo: 'dia', mesesDepois: 1, dia: 31, ajuste: 'prorroga' },
    fonte: 'Resolução CGSN 140/2018, art. 72',
  },
  {
    titulo: 'eSocial (folha e fechamento)',
    aplica: (p) => p.temFuncionarios,
    vencimento: { tipo: 'dia', mesesDepois: 1, dia: 15, ajuste: 'antecipa' },
    fonte: 'Manual de Orientação do eSocial',
  },
  {
    titulo: 'FGTS Digital (GFD)',
    aplica: (p) => p.temFuncionarios,
    vencimento: { tipo: 'dia', mesesDepois: 1, dia: 20, ajuste: 'antecipa' },
    fonte: 'Lei 8.036/1990, art. 15 (redação da Lei 14.438/2022)',
  },
  {
    titulo: 'DCTFWeb',
    aplica: (p) => p.temFuncionarios || lucro(p),
    vencimento: { tipo: 'dia', mesesDepois: 1, dia: 15, ajuste: 'antecipa' },
    fonte: 'IN RFB 2.005/2021',
  },
  {
    titulo: 'DARF previdenciário (INSS)',
    aplica: (p) => p.temFuncionarios && !simplesOuMei(p),
    vencimento: { tipo: 'dia', mesesDepois: 1, dia: 20, ajuste: 'antecipa' },
    fonte: 'Lei 8.212/1991, art. 30',
  },
  {
    titulo: 'EFD-Reinf',
    aplica: (p) => lucro(p),
    vencimento: { tipo: 'dia', mesesDepois: 1, dia: 15, ajuste: 'antecipa' },
    fonte: 'IN RFB 2.043/2021',
  },
  {
    titulo: 'PIS e COFINS',
    aplica: (p) => lucro(p),
    vencimento: { tipo: 'dia', mesesDepois: 1, dia: 25, ajuste: 'antecipa' },
    fonte: 'Lei 11.933/2009',
  },
  {
    titulo: 'EFD-Contribuições',
    aplica: (p) => lucro(p),
    vencimento: { tipo: 'diaUtil', mesesDepois: 2, n: 10 },
    fonte: 'IN RFB 1.252/2012',
  },
  {
    titulo: 'IRPJ e CSLL (trimestral)',
    aplica: (p, mes) => lucro(p) && fimDeTrimestre(mes),
    vencimento: { tipo: 'ultimoDiaUtil', mesesDepois: 1 },
    fonte: 'Lei 9.430/1996, arts. 1º e 5º',
  },
];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ehUtil(d: Date, feriados: Set<string>) {
  const dow = d.getUTCDay();
  return dow !== 0 && dow !== 6 && !feriados.has(iso(d));
}

function diasNoMes(ano: number, mes0: number) {
  return new Date(Date.UTC(ano, mes0 + 1, 0)).getUTCDate();
}

// Calcula o vencimento de uma regra para a competência "AAAA-MM".
// Datas em UTC à meia-noite (data "só dia").
export function calcularPrazo(regra: RegraObrigacao, competencia: string, feriados: Set<string>): Date {
  const [ano, mes] = competencia.split('-').map(Number);
  const alvo = new Date(Date.UTC(ano, mes - 1 + regra.vencimento.mesesDepois, 1));
  const a = alvo.getUTCFullYear();
  const m0 = alvo.getUTCMonth();
  const v = regra.vencimento;

  if (v.tipo === 'ultimoDiaUtil') {
    const d = new Date(Date.UTC(a, m0, diasNoMes(a, m0)));
    while (!ehUtil(d, feriados)) d.setUTCDate(d.getUTCDate() - 1);
    return d;
  }

  if (v.tipo === 'diaUtil') {
    const d = new Date(Date.UTC(a, m0, 1));
    let contados = ehUtil(d, feriados) ? 1 : 0;
    while (contados < v.n) {
      d.setUTCDate(d.getUTCDate() + 1);
      if (ehUtil(d, feriados)) contados++;
    }
    return d;
  }

  const d = new Date(Date.UTC(a, m0, Math.min(v.dia, diasNoMes(a, m0))));
  const passo = v.ajuste === 'antecipa' ? -1 : 1;
  while (!ehUtil(d, feriados)) d.setUTCDate(d.getUTCDate() + passo);
  return d;
}
