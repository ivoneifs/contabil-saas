// Tabelas oficiais usadas no cálculo da folha. Ao mudar o ano, acrescente
// uma nova entrada; o cálculo escolhe a tabela pela competência.
//
// 2026:
// - INSS: Portaria Interministerial MPS/MF nº 13, de 09/01/2026
//   (salário mínimo R$ 1.621,00; teto R$ 8.475,55).
// - IRRF: tabela progressiva mensal publicada pela Receita Federal para 2026,
//   com a redução da Lei nº 15.270/2025 (isenção efetiva até R$ 5.000,00 e
//   redução decrescente até R$ 7.350,00).

export interface Faixa {
  ate: number | null; // null = sem limite
  aliquota: number; // em fração (0.075 = 7,5%)
  deduzir?: number; // parcela a deduzir (IRRF)
}

export interface TabelasAno {
  ano: number;
  salarioMinimo: number;
  inss: { faixas: Faixa[]; teto: number; contribuinteIndividual: number };
  irrf: {
    faixas: Faixa[];
    dependente: number;
    descontoSimplificado: number;
    // Lei 15.270/2025
    reducao: { isencaoAte: number; reducaoMaxima: number; ate: number; constante: number; fator: number } | null;
  };
  fgts: { padrao: number; aprendiz: number };
  fontes: string[];
}

export const TABELAS: Record<number, TabelasAno> = {
  2026: {
    ano: 2026,
    salarioMinimo: 1621.0,
    inss: {
      faixas: [
        { ate: 1621.0, aliquota: 0.075 },
        { ate: 2902.84, aliquota: 0.09 },
        { ate: 4354.27, aliquota: 0.12 },
        { ate: 8475.55, aliquota: 0.14 },
      ],
      teto: 8475.55,
      contribuinteIndividual: 0.11,
    },
    irrf: {
      faixas: [
        { ate: 2428.8, aliquota: 0, deduzir: 0 },
        { ate: 2826.65, aliquota: 0.075, deduzir: 182.16 },
        { ate: 3751.05, aliquota: 0.15, deduzir: 394.16 },
        { ate: 4664.68, aliquota: 0.225, deduzir: 675.49 },
        { ate: null, aliquota: 0.275, deduzir: 908.73 },
      ],
      dependente: 189.59,
      descontoSimplificado: 607.2,
      reducao: { isencaoAte: 5000.0, reducaoMaxima: 312.89, ate: 7350.0, constante: 978.62, fator: 0.133145 },
    },
    fgts: { padrao: 0.08, aprendiz: 0.02 },
    fontes: [
      'INSS: Portaria Interministerial MPS/MF nº 13/2026',
      'IRRF: Receita Federal, tabela progressiva mensal 2026 e Lei nº 15.270/2025',
      'FGTS: Lei nº 8.036/1990, art. 15',
    ],
  },
};

export function tabelasDe(competencia: string): TabelasAno {
  const ano = Number(competencia.slice(0, 4));
  const anos = Object.keys(TABELAS).map(Number).sort();
  // Usa a do ano ou a mais recente anterior; nunca uma tabela futura.
  const escolhido = [...anos].reverse().find((a) => a <= ano) ?? anos[0];
  return TABELAS[escolhido];
}
