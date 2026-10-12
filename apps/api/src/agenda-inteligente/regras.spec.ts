import { REGRAS, calcularPrazo } from './regras';

const regra = (titulo: string) => REGRAS.find((r) => r.titulo === titulo)!;
const dia = (d: Date) => d.toISOString().slice(0, 10);

describe('calcularPrazo', () => {
  const semFeriados = new Set<string>();

  it('DAS vence dia 20 do mês seguinte', () => {
    // 20/10/2026 é terça-feira
    expect(dia(calcularPrazo(regra('PGDAS-D e DAS'), '2026-09', semFeriados))).toBe('2026-10-20');
  });

  it('DAS prorroga quando o dia 20 cai no fim de semana', () => {
    // 20/09/2026 é domingo -> segunda 21/09
    expect(dia(calcularPrazo(regra('PGDAS-D e DAS'), '2026-08', semFeriados))).toBe('2026-09-21');
  });

  it('FGTS antecipa quando o dia 20 cai no fim de semana', () => {
    // 20/09/2026 é domingo -> sexta 18/09
    expect(dia(calcularPrazo(regra('FGTS Digital (GFD)'), '2026-08', semFeriados))).toBe('2026-09-18');
  });

  it('respeita feriados', () => {
    // 15/11/2026 é domingo; 13/11 sexta como feriado fictício -> quinta 12/11
    const feriados = new Set(['2026-11-13']);
    expect(dia(calcularPrazo(regra('eSocial (folha e fechamento)'), '2026-10', feriados))).toBe('2026-11-12');
  });

  it('IRPJ trimestral vence no último dia útil do mês seguinte', () => {
    // 31/10/2026 é sábado -> sexta 30/10
    expect(dia(calcularPrazo(regra('IRPJ e CSLL (trimestral)'), '2026-09', semFeriados))).toBe('2026-10-30');
  });

  it('EFD-Contribuições vence no 10º dia útil do segundo mês', () => {
    // competência 08/2026 -> outubro/2026: 1º útil é qui 01/10; 10º útil é qua 14/10
    expect(dia(calcularPrazo(regra('EFD-Contribuições'), '2026-08', semFeriados))).toBe('2026-10-14');
  });

  it('competência de dezembro vence em janeiro do ano seguinte', () => {
    expect(dia(calcularPrazo(regra('PIS e COFINS'), '2026-12', semFeriados))).toBe('2027-01-25');
  });
});
