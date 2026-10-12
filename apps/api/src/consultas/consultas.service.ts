import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

const SEIS_HORAS = 6 * 60 * 60 * 1000;

// Séries do SGS do Banco Central (valores mensais em %).
// SELIC e CDI publicam o mês corrente ainda parcial; ele é descartado.
const SERIES_BCB = [
  { codigo: 4390, sigla: 'SELIC', nome: 'SELIC acumulada no mês', parcial: true },
  { codigo: 4391, sigla: 'CDI', nome: 'CDI acumulado no mês', parcial: true },
  { codigo: 433, sigla: 'IPCA', nome: 'IPCA (IBGE)', parcial: false },
  { codigo: 188, sigla: 'INPC', nome: 'INPC (IBGE)', parcial: false },
  { codigo: 189, sigla: 'IGP-M', nome: 'IGP-M (FGV)', parcial: false },
] as const;

// "dd/mm/aaaa" -> "aaaa-mm"
function mesDe(data: string) {
  const [, mes, ano] = data.split('/');
  return `${ano}-${mes}`;
}

@Injectable()
export class ConsultasService {
  private cache = new Map<string, { expira: number; valor: unknown }>();

  private async buscarJson<T>(url: string, ttl = SEIS_HORAS): Promise<T> {
    const hit = this.cache.get(url);
    if (hit && hit.expira > Date.now()) return hit.valor as T;

    let res: Response;
    try {
      res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'contabil-saas/1.0' }, signal: AbortSignal.timeout(15000) });
    } catch {
      throw new BadGatewayException('Serviço externo indisponível no momento. Tente de novo em instantes.');
    }
    if (res.status === 404) throw new NotFoundException('Não encontrado.');
    if (!res.ok) throw new BadGatewayException(`Serviço externo respondeu ${res.status}.`);

    const valor = (await res.json()) as T;
    this.cache.set(url, { expira: Date.now() + ttl, valor });
    return valor;
  }

  cnpj(cnpj: string) {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) throw new BadRequestException('CNPJ deve ter 14 dígitos.');
    return this.buscarJson(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
  }

  cep(cep: string) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) throw new BadRequestException('CEP deve ter 8 dígitos.');
    return this.buscarJson(`https://brasilapi.com.br/api/cep/v2/${digits}`);
  }

  feriados(ano: number) {
    if (!Number.isInteger(ano) || ano < 1900 || ano > 2199) throw new BadRequestException('Ano inválido.');
    return this.buscarJson<{ date: string; name: string; type: string }[]>(
      `https://brasilapi.com.br/api/feriados/v1/${ano}`,
      24 * SEIS_HORAS,
    );
  }

  async indices() {
    return Promise.all(
      SERIES_BCB.map(async (s) => {
        try {
          const dados = await this.buscarJson<{ data: string; valor: string }[]>(
            `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${s.codigo}/dados/ultimos/13?formato=json`,
          );
          const mesAtual = new Date().toISOString().slice(0, 7);
          const valores = dados
            .map((d) => ({ mes: mesDe(d.data), valor: Number(d.valor) }))
            .filter((d) => !(s.parcial && d.mes >= mesAtual))
            .sort((a, b) => a.mes.localeCompare(b.mes))
            .slice(-12);
          // Acumulado em 12 meses por capitalização composta.
          const acumulado12m = (valores.reduce((acc, v) => acc * (1 + v.valor / 100), 1) - 1) * 100;
          return { codigo: s.codigo, sigla: s.sigla, nome: s.nome, valores, ultimo: valores[valores.length - 1] ?? null, acumulado12m, erro: null };
        } catch (err) {
          return { codigo: s.codigo, sigla: s.sigla, nome: s.nome, valores: [], ultimo: null, acumulado12m: null, erro: err instanceof Error ? err.message : 'Falha' };
        }
      }),
    );
  }
}
