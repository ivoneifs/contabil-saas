import { request } from 'https';
import { ConsultasService } from '../consultas/consultas.service';
import { SerproClient, CredencialSerpro } from './serpro.client';

export interface ResultadoTeste {
  ok: boolean;
  // "demonstracao": funcionou no ambiente de testes do órgão, falta a credencial de produção.
  nivel?: 'producao' | 'demonstracao' | 'certificado';
  mensagem: string;
  ms?: number;
}

export interface ContextoTeste {
  consultas: ConsultasService;
  focusNfe: { token: string; baseUrl: string } | null;
  asaasKey: string | null;
  nuvemFiscal: { clientId: string; clientSecret: string } | null;
  serpro: { consumerKey: string; consumerSecret: string } | null;
  certEscritorio: { pfx: Buffer; senha: string; documento: string | null } | null;
  certCliente: { pfx: Buffer; senha: string } | null;
  iaConfigurada: string | null;
}

// GET com certificado cliente (mTLS): mede se o órgão aceita o A1.
function getComCertificado(url: string, cert: { pfx: Buffer; senha: string }) {
  return new Promise<number>((resolve, reject) => {
    const req = request(url, { method: 'GET', pfx: cert.pfx, passphrase: cert.senha, timeout: 20000 }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on('timeout', () => req.destroy(new Error('sem resposta em 20 s')));
    req.on('error', reject);
    req.end();
  });
}

async function http(url: string, init: RequestInit = {}) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'contabil-saas/1.0', ...(init.headers ?? {}) } });
}

const msgErro = (e: unknown) => (e instanceof Error ? e.message : String(e));

export const TESTADORES: Record<string, (c: ContextoTeste) => Promise<ResultadoTeste>> = {
  'brasilapi-cnpj': async ({ consultas }) => {
    const r = (await consultas.cnpj('00000000000191')) as { razao_social?: string };
    return { ok: !!r.razao_social, nivel: 'producao', mensagem: `Receita respondeu: ${r.razao_social}` };
  },
  'brasilapi-cep': async ({ consultas }) => {
    const r = (await consultas.cep('01001000')) as { city?: string };
    return { ok: !!r.city, nivel: 'producao', mensagem: `CEP 01001-000 → ${r.city}` };
  },
  'brasilapi-feriados': async ({ consultas }) => {
    const r = await consultas.feriados(new Date().getFullYear());
    return { ok: r.length > 0, nivel: 'producao', mensagem: `${r.length} feriados nacionais em ${new Date().getFullYear()}` };
  },
  'bcb-sgs': async ({ consultas }) => {
    const r = await consultas.indices();
    const ok = r.filter((i) => !i.erro);
    return { ok: ok.length > 0, nivel: 'producao', mensagem: `${ok.length} de ${r.length} séries do Banco Central atualizadas` };
  },
  'bcb-ptax': async ({ consultas }) => {
    const r = await consultas.cambio();
    const usd = r.find((m) => m.moeda === 'USD')?.ultimo;
    return { ok: !!usd, nivel: 'producao', mensagem: usd ? `Dólar PTAX ${usd.venda.toFixed(4)} em ${usd.data}` : 'PTAX sem cotação' };
  },
  ibge: async ({ consultas }) => {
    const r = await consultas.municipios('BA');
    return { ok: r.length > 400, nivel: 'producao', mensagem: `${r.length} municípios da BA com código IBGE` };
  },
  'sefaz-status': async ({ consultas }) => {
    const r = (await consultas.statusSefaz()) as { autorizadores: { geral: string }[] };
    const on = r.autorizadores.filter((a) => a.geral === 'online').length;
    return { ok: true, nivel: 'producao', mensagem: `${on} de ${r.autorizadores.length} autorizadores da NF-e online agora` };
  },
  'serpro-integra-contador': async ({ serpro, certEscritorio }) => {
    if (serpro && certEscritorio?.documento) {
      const cred: CredencialSerpro = { ...serpro, pfx: certEscritorio.pfx, senhaPfx: certEscritorio.senha, documento: certEscritorio.documento };
      await new SerproClient('producao', cred).autenticar();
      return { ok: true, nivel: 'producao', mensagem: 'Autenticado no SERPRO com as chaves e o e-CNPJ do escritório.' };
    }
    const r = await new SerproClient('demonstracao', null).chamar('Consultar', '00000000000000', { idSistema: 'CCMEI', idServico: 'DADOSCCMEI122' });
    return {
      ok: false,
      nivel: 'demonstracao',
      mensagem: `Ambiente de demonstração do SERPRO respondeu (${r.mensagens[0]?.texto ?? 'ok'}). Cadastre as chaves e o certificado do escritório para produção.`,
    };
  },
  'inss-previdencia': async (c) => TESTADORES['serpro-integra-contador'](c),
  esocial: async ({ certEscritorio }) => {
    if (!certEscritorio) return { ok: false, mensagem: 'Envie o certificado A1 do escritório.' };
    const s = await getComCertificado('https://webservices.envio.esocial.gov.br/servicos/empregador/enviarloteeventos/WsEnviarLoteEventos.svc?wsdl', certEscritorio);
    return s < 400
      ? { ok: true, nivel: 'certificado', mensagem: 'O webservice do eSocial aceitou o certificado do escritório.' }
      : { ok: false, mensagem: `O eSocial recusou o certificado (HTTP ${s}). Use um e-CNPJ/e-CPF A1 ICP-Brasil válido.` };
  },
  'fgts-digital': async (c) => {
    const r = await TESTADORES.esocial(c);
    return r.ok ? { ...r, mensagem: 'Certificado aceito no eSocial, base do FGTS Digital.' } : r;
  },
  'sefaz-dfe': async ({ certCliente }) => {
    if (!certCliente) return { ok: false, mensagem: 'Envie o certificado A1 de pelo menos um cliente.' };
    const s = await getComCertificado('https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx?wsdl', certCliente);
    return s < 400
      ? { ok: true, nivel: 'certificado', mensagem: 'A SEFAZ Nacional aceitou o certificado do cliente.' }
      : { ok: false, mensagem: `A SEFAZ recusou o certificado (HTTP ${s}).` };
  },
  'focus-nfe': async ({ focusNfe }) => {
    if (!focusNfe) return { ok: false, mensagem: 'Informe o token do Focus NFe em Configurações.' };
    const base = (focusNfe.baseUrl || 'https://api.focusnfe.com.br').replace(/\/$/, '');
    const r = await http(`${base}/v2/nfe/teste-conexao-contabil-saas`, {
      headers: { Authorization: `Basic ${Buffer.from(`${focusNfe.token}:`).toString('base64')}` },
    });
    if (r.status === 401 || r.status === 403) return { ok: false, mensagem: 'O Focus NFe recusou o token.' };
    return { ok: true, nivel: base.includes('homologacao') ? 'demonstracao' : 'producao', mensagem: `Token aceito pelo Focus NFe (${base.includes('homologacao') ? 'homologação' : 'produção'}).` };
  },
  asaas: async ({ asaasKey }) => {
    if (!asaasKey) return { ok: false, mensagem: 'Informe a chave do Asaas em Configurações.' };
    const sandbox = asaasKey.includes('_hmlg_');
    const r = await http(`${sandbox ? 'https://api-sandbox.asaas.com' : 'https://api.asaas.com'}/v3/myAccount`, { headers: { access_token: asaasKey } });
    if (!r.ok) return { ok: false, mensagem: `O Asaas recusou a chave (HTTP ${r.status}).` };
    const j = (await r.json()) as { name?: string };
    return { ok: true, nivel: sandbox ? 'demonstracao' : 'producao', mensagem: `Conta Asaas ${j.name ?? ''} ${sandbox ? '(sandbox)' : ''}`.trim() };
  },
  'nuvem-fiscal': async ({ nuvemFiscal }) => {
    if (!nuvemFiscal) return { ok: false, mensagem: 'Informe o Client ID e o Secret da Nuvem Fiscal em Configurações.' };
    const r = await http('https://auth.nuvemfiscal.com.br/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: nuvemFiscal.clientId, client_secret: nuvemFiscal.clientSecret, scope: 'empresa cnpj cep nfe nfce nfse cte mdfe' }),
    });
    if (!r.ok) return { ok: false, mensagem: `A Nuvem Fiscal recusou as credenciais (HTTP ${r.status}).` };
    return { ok: true, nivel: 'producao', mensagem: 'Token emitido pela Nuvem Fiscal.' };
  },
  ia: async ({ iaConfigurada }) =>
    iaConfigurada
      ? { ok: true, nivel: 'producao', mensagem: `Chave "${iaConfigurada}" ativa. Teste a resposta em Super Admin > Chaves de IA.` }
      : { ok: false, mensagem: 'Nenhuma chave de IA cadastrada pelo Super Admin.' },
};

export async function executarTeste(id: string, ctx: ContextoTeste): Promise<ResultadoTeste> {
  const t = TESTADORES[id];
  if (!t) return { ok: false, mensagem: 'Integração sem teste automático.' };
  const inicio = Date.now();
  try {
    return { ...(await t(ctx)), ms: Date.now() - inicio };
  } catch (e) {
    return { ok: false, mensagem: msgErro(e), ms: Date.now() - inicio };
  }
}
