import { request } from 'https';

// Cliente do SERPRO Integra Contador.
// Autenticação: POST /authenticate com Basic (consumer key:secret), header
// role-type TERCEIROS e mTLS com o e-CNPJ A1 do contratante (escritório).
// Chamadas: POST {gateway}/{Consultar|Emitir|Declarar|Monitorar|Apoiar}
// com Bearer access_token + header jwt_token.
// O ambiente "demonstracao" usa o gateway trial público do SERPRO, que
// devolve dados fictícios e serve para validar a integração sem contrato.

const AUTH_URL = 'https://autenticacao.sapi.serpro.gov.br/authenticate';
const GATEWAY = {
  producao: 'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1',
  demonstracao: 'https://gateway.apiserpro.serpro.gov.br/integra-contador-trial/v1',
};
const TOKEN_DEMONSTRACAO = '06aef429-a981-3ec5-a1f8-71d38d86481e';

export type AmbienteSerpro = keyof typeof GATEWAY;
export type OperacaoSerpro = 'Consultar' | 'Emitir' | 'Declarar' | 'Monitorar' | 'Apoiar';

export interface CredencialSerpro {
  consumerKey: string;
  consumerSecret: string;
  pfx: Buffer;
  senhaPfx: string;
  // CNPJ/CPF do escritório (contratante e autor do pedido).
  documento: string;
}

interface TokenSerpro {
  accessToken: string;
  jwtToken: string;
  expiraEm: number;
}

export class ErroSerpro extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function post(url: string, corpo: string, headers: Record<string, string>, pfx?: { pfx: Buffer; passphrase: string }) {
  return new Promise<{ status: number; corpo: string }>((resolve, reject) => {
    const req = request(
      url,
      { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(corpo) }, timeout: 30000, ...(pfx ?? {}) },
      (res) => {
        const partes: Buffer[] = [];
        res.on('data', (p) => partes.push(p));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, corpo: Buffer.concat(partes).toString('utf8') }));
      },
    );
    req.on('timeout', () => req.destroy(new ErroSerpro('O SERPRO não respondeu em 30 segundos.')));
    req.on('error', (e) => reject(e instanceof ErroSerpro ? e : new ErroSerpro(`Falha de conexão com o SERPRO: ${e.message}`)));
    req.write(corpo);
    req.end();
  });
}

const tipoDoc = (doc: string) => (doc.replace(/\D/g, '').length === 11 ? 1 : 2);

export class SerproClient {
  private static tokens = new Map<string, TokenSerpro>();

  constructor(
    private readonly ambiente: AmbienteSerpro,
    private readonly cred: CredencialSerpro | null,
  ) {}

  async autenticar(): Promise<TokenSerpro> {
    if (this.ambiente === 'demonstracao') {
      return { accessToken: TOKEN_DEMONSTRACAO, jwtToken: TOKEN_DEMONSTRACAO, expiraEm: Date.now() + 3600_000 };
    }
    if (!this.cred) throw new ErroSerpro('Cadastre as chaves do SERPRO e o certificado A1 do escritório.');
    const chave = `${this.cred.consumerKey}:${this.cred.documento}`;
    const cache = SerproClient.tokens.get(chave);
    if (cache && cache.expiraEm > Date.now() + 60_000) return cache;

    const basic = Buffer.from(`${this.cred.consumerKey}:${this.cred.consumerSecret}`).toString('base64');
    const r = await post(
      AUTH_URL,
      'grant_type=client_credentials',
      { Authorization: `Basic ${basic}`, 'role-type': 'TERCEIROS', 'content-type': 'application/x-www-form-urlencoded' },
      { pfx: this.cred.pfx, passphrase: this.cred.senhaPfx },
    );
    if (r.status === 401 || r.status === 403) throw new ErroSerpro('O SERPRO recusou as chaves ou o certificado. Confira consumer key, secret e o e-CNPJ do contratante.', r.status);
    if (r.status >= 400) throw new ErroSerpro(`Autenticação no SERPRO falhou (HTTP ${r.status}).`, r.status);
    const j = JSON.parse(r.corpo) as { access_token: string; jwt_token: string; expires_in: number };
    const token = { accessToken: j.access_token, jwtToken: j.jwt_token, expiraEm: Date.now() + Number(j.expires_in) * 1000 };
    SerproClient.tokens.set(chave, token);
    return token;
  }

  async chamar(operacao: OperacaoSerpro, contribuinte: string, pedido: { idSistema: string; idServico: string; versaoSistema?: string; dados?: unknown }) {
    const token = await this.autenticar();
    const doc = this.ambiente === 'demonstracao' ? '00000000000000' : this.cred!.documento;
    const corpo = JSON.stringify({
      contratante: { numero: doc, tipo: tipoDoc(doc) },
      autorPedidoDados: { numero: doc, tipo: tipoDoc(doc) },
      contribuinte: { numero: contribuinte.replace(/\D/g, ''), tipo: tipoDoc(contribuinte) },
      pedidoDados: {
        idSistema: pedido.idSistema,
        idServico: pedido.idServico,
        versaoSistema: pedido.versaoSistema ?? '1.0',
        dados: typeof pedido.dados === 'string' ? pedido.dados : pedido.dados ? JSON.stringify(pedido.dados) : '',
      },
    });
    const r = await post(
      `${GATEWAY[this.ambiente]}/${operacao}`,
      corpo,
      { Authorization: `Bearer ${token.accessToken}`, jwt_token: token.jwtToken, 'Content-Type': 'application/json' },
      this.ambiente === 'producao' && this.cred ? { pfx: this.cred.pfx, passphrase: this.cred.senhaPfx } : undefined,
    );
    let j: { status?: string | number; mensagens?: { codigo: string; texto: string }[]; dados?: string };
    try {
      j = JSON.parse(r.corpo);
    } catch {
      throw new ErroSerpro(`Resposta inesperada do SERPRO (HTTP ${r.status}).`, r.status);
    }
    const status = Number(j.status ?? r.status);
    if (status >= 400) throw new ErroSerpro(j.mensagens?.map((m) => m.texto).join(' ') || `SERPRO respondeu ${status}.`, status);
    let dados: unknown = j.dados;
    try {
      dados = j.dados ? JSON.parse(j.dados) : null;
    } catch {
      // alguns serviços devolvem texto/base64 em "dados"
    }
    return { status, mensagens: j.mensagens ?? [], dados };
  }
}
