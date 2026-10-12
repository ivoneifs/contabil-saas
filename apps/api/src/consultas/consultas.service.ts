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

  // Consulta com reserva automática: BrasilAPI e, se falhar ou estiver
  // limitada, minhareceita.org (mesmo formato de resposta, dados abertos da Receita).
  async cnpj(cnpj: string) {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) throw new BadRequestException('CNPJ deve ter 14 dígitos.');
    const fontes = [`https://brasilapi.com.br/api/cnpj/v1/${digits}`, `https://minhareceita.org/${digits}`];
    let ultimoErro: unknown;
    for (const url of fontes) {
      try {
        return await this.buscarJson(url);
      } catch (err) {
        if (err instanceof NotFoundException) throw new NotFoundException('CNPJ não encontrado na Receita Federal.');
        ultimoErro = err;
      }
    }
    throw ultimoErro;
  }

  // Câmbio PTAX oficial do Banco Central (últimos 30 dias, fechamento).
  async cambio() {
    const fim = new Date();
    const ini = new Date(fim.getTime() - 30 * 86400000);
    const fmt = (d: Date) => `'${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}'`;
    const moedas = ['USD', 'EUR'];
    return Promise.all(
      moedas.map(async (moeda) => {
        try {
          const url =
            'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)' +
            `?@moeda='${moeda}'&@dataInicial=${fmt(ini)}&@dataFinalCotacao=${fmt(fim)}&$format=json&$filter=tipoBoletim%20eq%20'Fechamento'`;
          const r = await this.buscarJson<{ value: { cotacaoCompra: number; cotacaoVenda: number; dataHoraCotacao: string }[] }>(url, 60 * 60 * 1000);
          const valores = r.value.map((v) => ({ data: v.dataHoraCotacao.slice(0, 10), compra: v.cotacaoCompra, venda: v.cotacaoVenda }));
          return { moeda, ultimo: valores[valores.length - 1] ?? null, valores, erro: null };
        } catch (err) {
          return { moeda, ultimo: null, valores: [], erro: err instanceof Error ? err.message : 'Falha' };
        }
      }),
    );
  }

  async municipios(uf: string) {
    if (!/^[A-Za-z]{2}$/.test(uf)) throw new BadRequestException('UF inválida.');
    const lista = await this.buscarJson<{ id: number; nome: string }[]>(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.toUpperCase()}/municipios`,
      7 * 24 * SEIS_HORAS,
    );
    return lista.map((m) => ({ codigoIbge: String(m.id), nome: m.nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  async cnae(codigo: string) {
    const d = codigo.replace(/\D/g, '');
    if (d.length !== 7) throw new BadRequestException('Informe o CNAE com 7 dígitos (ex.: 4721-1/02).');
    const r = await this.buscarJson<{ id: string; descricao: string; atividades?: string[]; observacoes?: string[]; classe?: { id: string; descricao: string; grupo?: { descricao: string; divisao?: { descricao: string; secao?: { descricao: string } } } } }>(
      `https://servicodados.ibge.gov.br/api/v2/cnae/subclasses/${d}`,
      7 * 24 * SEIS_HORAS,
    );
    if (!r || !(r as { id?: string }).id) throw new NotFoundException('CNAE não encontrado.');
    return {
      codigo: r.id,
      descricao: r.descricao,
      classe: r.classe?.descricao ?? null,
      grupo: r.classe?.grupo?.descricao ?? null,
      divisao: r.classe?.grupo?.divisao?.descricao ?? null,
      secao: r.classe?.grupo?.divisao?.secao?.descricao ?? null,
      atividades: r.atividades ?? [],
    };
  }

  async ncm(busca: string) {
    const termo = busca.trim();
    if (termo.length < 2) throw new BadRequestException('Digite ao menos 2 caracteres.');
    const digitos = termo.replace(/\D/g, '');
    // A BrasilAPI busca por código; por descrição, filtramos a tabela completa (em cache).
    if (digitos.length >= 2 && digitos.length === termo.replace(/[.\s]/g, '').length) {
      return (await this.buscarJson<{ codigo: string; descricao: string }[]>(`https://brasilapi.com.br/api/ncm/v1?search=${digitos}`))
        .map((n) => ({ ...n, descricao: n.descricao.replace(/<[^>]+>/g, '') }))
        .slice(0, 100);
    }
    const tabela = await this.buscarJson<{ codigo: string; descricao: string }[]>('https://brasilapi.com.br/api/ncm/v1', 7 * 24 * SEIS_HORAS);
    const normalizar = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Palavra inteira (evita "pão" casar com "japão").
    const palavras = normalizar(termo).split(/\s+/).filter(Boolean).map((p) => new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '')}`));
    return tabela
      .map((n) => ({ ...n, descricao: n.descricao.replace(/<[^>]+>/g, '') }))
      .filter((n) => palavras.every((re) => re.test(normalizar(n.descricao))))
      .slice(0, 100);
  }

  // Disponibilidade dos webservices da NF-e por autorizador (portal nacional).
  async statusSefaz() {
    const url = 'https://www.nfe.fazenda.gov.br/portal/disponibilidade.aspx';
    const hit = this.cache.get(url);
    if (hit && hit.expira > Date.now()) return hit.valor;
    let html: string;
    try {
      // O portal exige cookie de sessão: primeira chamada devolve 302 com cookie.
      const r1 = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
      const cookie = r1.headers.get('set-cookie')?.split(';')[0] ?? '';
      const destino = new URL(r1.headers.get('location') ?? url, url).toString();
      const r2 = await fetch(destino, { headers: { 'User-Agent': 'Mozilla/5.0', Cookie: cookie }, signal: AbortSignal.timeout(15000) });
      html = await r2.text();
    } catch {
      throw new BadGatewayException('Portal da NF-e indisponível no momento.');
    }
    const servicos = ['autorizacao', 'retornoAutorizacao', 'inutilizacao', 'consultaProtocolo', 'statusServico', 'tempoMedio', 'consultaCadastro', 'recepcaoEvento'];
    const autorizadores = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
      .map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1]))
      .filter((cels) => cels.length === 9)
      .map((cels) => {
        const nome = cels[0].replace(/<[^>]+>/g, '').trim();
        const status = Object.fromEntries(
          cels.slice(1).map((c, i) => {
            const bola = /bola_(verde|amarela|vermelho)/.exec(c)?.[1];
            const valor = bola === 'verde' ? 'online' : bola === 'amarela' ? 'instavel' : bola === 'vermelho' ? 'offline' : c.replace(/<[^>]+>/g, '').trim() || null;
            return [servicos[i], valor];
          }),
        );
        const valores = Object.entries(status).filter(([k]) => k !== 'tempoMedio').map(([, v]) => v);
        const geral = valores.includes('offline') ? 'offline' : valores.includes('instavel') ? 'instavel' : 'online';
        return { autorizador: nome, geral, ...status };
      });
    if (!autorizadores.length) throw new BadGatewayException('Não foi possível ler o status da SEFAZ.');
    const verificado = /Última Verificação:\s*([^<]+)/.exec(html)?.[1]?.trim() ?? null;
    const valor = { verificadoEm: verificado, autorizadores };
    this.cache.set(url, { expira: Date.now() + 5 * 60 * 1000, valor });
    return valor;
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
