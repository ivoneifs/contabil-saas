import { XMLParser } from 'fast-xml-parser';
import { ModeloDocFiscal } from '@prisma/client';

export interface DadosLidos {
  modelo: ModeloDocFiscal;
  chaveAcesso: string | null;
  numero: string | null;
  serie: string | null;
  dataEmissao: Date | null;
  emitenteDoc: string | null;
  emitenteNome: string | null;
  destinatarioDoc: string | null;
  destinatarioNome: string | null;
  valorTotal: number | null;
  naturezaOperacao: string | null;
  protocolo: string | null;
  situacao: string | null;
  descricaoEvento: string | null;
  // Para eventos: chave do documento afetado e se é cancelamento homologado.
  chaveAfetada?: string | null;
  cancelamento?: boolean;
}

// parseTagValue: false mantém tudo como texto (CNPJ com zero à esquerda,
// chave de 44 dígitos). removeNSPrefix ignora prefixos de namespace.
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

type No = Record<string, unknown> | undefined;

const no = (v: unknown): No => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : Array.isArray(v) ? (v[0] as No) : undefined);
const txt = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'object') return txt((v as Record<string, unknown>)['#text']);
  const s = String(v).trim();
  return s || null;
};
const num = (v: unknown): number | null => {
  const s = txt(v);
  if (!s) return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const data = (v: unknown): Date | null => {
  const s = txt(v);
  if (!s) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00-03:00` : s);
  return Number.isNaN(d.getTime()) ? null : d;
};
const doc = (n: No): string | null => txt(n?.CNPJ) ?? txt(n?.CPF) ?? txt(n?.idEstrangeiro);
const chaveDoId = (id: unknown) => txt(id)?.replace(/\D/g, '') || null;

// Procura a primeira ocorrência de uma tag em qualquer profundidade
// (layouts municipais de NFS-e variam muito).
function buscar(obj: unknown, tag: string, prof = 0): unknown {
  if (!obj || typeof obj !== 'object' || prof > 12) return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = buscar(item, tag, prof + 1);
      if (r !== undefined) return r;
    }
    return undefined;
  }
  const o = obj as Record<string, unknown>;
  if (tag in o) return o[tag];
  for (const v of Object.values(o)) {
    const r = buscar(v, tag, prof + 1);
    if (r !== undefined) return r;
  }
  return undefined;
}

function situacaoPorStatus(cStat: string | null): string {
  if (!cStat) return 'SEM_PROTOCOLO';
  if (['100', '150'].includes(cStat)) return 'AUTORIZADA';
  if (['101', '151', '135', '155'].includes(cStat)) return 'CANCELADA';
  if (['110', '205', '301', '302', '303'].includes(cStat)) return 'DENEGADA';
  return `STATUS_${cStat}`;
}

const vazio = (modelo: ModeloDocFiscal): DadosLidos => ({
  modelo,
  chaveAcesso: null,
  numero: null,
  serie: null,
  dataEmissao: null,
  emitenteDoc: null,
  emitenteNome: null,
  destinatarioDoc: null,
  destinatarioNome: null,
  valorTotal: null,
  naturezaOperacao: null,
  protocolo: null,
  situacao: null,
  descricaoEvento: null,
});

function lerNfe(raiz: No): DadosLidos | null {
  const nfe = no(raiz?.NFe) ?? raiz;
  const inf = no(nfe?.infNFe);
  if (!inf) return null;
  const ide = no(inf.ide);
  const mod = txt(ide?.mod);
  const prot = no(no(raiz?.protNFe)?.infProt);
  const emit = no(inf.emit);
  const dest = no(inf.dest);
  return {
    ...vazio(mod === '65' ? 'NFCE' : 'NFE'),
    chaveAcesso: chaveDoId(inf['@Id']) ?? txt(prot?.chNFe),
    numero: txt(ide?.nNF),
    serie: txt(ide?.serie),
    dataEmissao: data(ide?.dhEmi ?? ide?.dEmi),
    emitenteDoc: doc(emit),
    emitenteNome: txt(emit?.xNome),
    destinatarioDoc: doc(dest),
    destinatarioNome: txt(dest?.xNome),
    valorTotal: num(no(no(inf.total)?.ICMSTot)?.vNF),
    naturezaOperacao: txt(ide?.natOp),
    protocolo: txt(prot?.nProt),
    situacao: situacaoPorStatus(txt(prot?.cStat)),
  };
}

function lerCte(raiz: No, os: boolean): DadosLidos | null {
  const cte = no(os ? raiz?.CTeOS : raiz?.CTe) ?? raiz;
  const inf = no(cte?.infCte);
  if (!inf) return null;
  const ide = no(inf.ide);
  const prot = no(no(raiz?.protCTe)?.infProt) ?? no(no(raiz?.protCTeOS)?.infProt);
  const emit = no(inf.emit);
  const dest = no(inf.dest) ?? no(inf.toma) ?? no(no(ide?.toma4));
  return {
    ...vazio(os || txt(ide?.mod) === '67' ? 'CTEOS' : 'CTE'),
    chaveAcesso: chaveDoId(inf['@Id']) ?? txt(prot?.chCTe),
    numero: txt(ide?.nCT),
    serie: txt(ide?.serie),
    dataEmissao: data(ide?.dhEmi),
    emitenteDoc: doc(emit),
    emitenteNome: txt(emit?.xNome),
    destinatarioDoc: doc(dest),
    destinatarioNome: txt(dest?.xNome),
    valorTotal: num(no(inf.vPrest)?.vTPrest),
    naturezaOperacao: txt(ide?.natOp),
    protocolo: txt(prot?.nProt),
    situacao: situacaoPorStatus(txt(prot?.cStat)),
  };
}

function lerMdfe(raiz: No): DadosLidos | null {
  const mdfe = no(raiz?.MDFe) ?? raiz;
  const inf = no(mdfe?.infMDFe);
  if (!inf) return null;
  const ide = no(inf.ide);
  const prot = no(no(raiz?.protMDFe)?.infProt);
  const emit = no(inf.emit);
  return {
    ...vazio('MDFE'),
    chaveAcesso: chaveDoId(inf['@Id']) ?? txt(prot?.chMDFe),
    numero: txt(ide?.nMDF),
    serie: txt(ide?.serie),
    dataEmissao: data(ide?.dhEmi),
    emitenteDoc: doc(emit),
    emitenteNome: txt(emit?.xNome),
    valorTotal: num(no(inf.tot)?.vCarga),
    naturezaOperacao: `${txt(ide?.UFIni) ?? '?'} → ${txt(ide?.UFFim) ?? '?'}`,
    protocolo: txt(prot?.nProt),
    situacao: situacaoPorStatus(txt(prot?.cStat)),
  };
}

function lerEvento(raiz: No): DadosLidos | null {
  const evento = no(raiz?.evento) ?? no(raiz?.eventoCTe) ?? no(raiz?.eventoMDFe);
  const inf = no(evento?.infEvento);
  if (!inf) return null;
  const ret = no(no(raiz?.retEvento)?.infEvento) ?? no(no(raiz?.retEventoCTe)?.infEvento) ?? no(no(raiz?.retEventoMDFe)?.infEvento);
  const tpEvento = txt(inf.tpEvento);
  const cStat = txt(ret?.cStat);
  const det = no(inf.detEvento);
  const descricao = txt(det?.descEvento) ?? txt(ret?.xEvento) ?? `Evento ${tpEvento}`;
  const chave = txt(inf.chNFe) ?? txt(inf.chCTe) ?? txt(inf.chMDFe);
  const homologado = cStat === '135' || cStat === '136' || cStat === '155';
  return {
    ...vazio('EVENTO'),
    chaveAcesso: chaveDoId(inf['@Id']),
    dataEmissao: data(inf.dhEvento),
    emitenteDoc: txt(inf.CNPJ) ?? txt(inf.CPF),
    protocolo: txt(ret?.nProt),
    situacao: homologado ? 'HOMOLOGADO' : situacaoPorStatus(cStat),
    descricaoEvento: [descricao, txt(det?.xJust) ?? txt(det?.xCorrecao)].filter(Boolean).join(' · '),
    chaveAfetada: chave,
    // 110111 cancelamento NF-e/NFC-e/CT-e; 110112 cancelamento por substituição; 110111 MDF-e também.
    cancelamento: homologado && (tpEvento === '110111' || tpEvento === '110112'),
  };
}

function lerNfseNacional(raiz: No): DadosLidos | null {
  const inf = no(raiz?.infNFSe);
  if (!inf) return null;
  const dps = no(no(inf.DPS)?.infDPS);
  const emit = no(inf.emit);
  const toma = no(dps?.toma);
  const valores = no(inf.valores);
  return {
    ...vazio('NFSE'),
    chaveAcesso: chaveDoId(inf['@Id']),
    numero: txt(inf.nNFSe),
    serie: txt(dps?.serie),
    dataEmissao: data(inf.dhProc ?? dps?.dhEmi),
    emitenteDoc: doc(emit),
    emitenteNome: txt(emit?.xNome),
    destinatarioDoc: doc(toma),
    destinatarioNome: txt(toma?.xNome),
    valorTotal: num(valores?.vLiq) ?? num(buscar(dps, 'vServ')),
    naturezaOperacao: txt(buscar(dps, 'xDescServ'))?.slice(0, 200) ?? null,
    situacao: 'AUTORIZADA',
  };
}

// NFS-e municipal no padrão ABRASF e variações (busca por nome de tag).
function lerNfseAbrasf(raiz: unknown): DadosLidos | null {
  const inf = buscar(raiz, 'InfNfse');
  if (!inf) return null;
  const prestador = buscar(inf, 'PrestadorServico') ?? buscar(inf, 'Prestador');
  const tomador = buscar(inf, 'TomadorServico') ?? buscar(inf, 'Tomador');
  const docDe = (n: unknown) => txt(buscar(n, 'Cnpj')) ?? txt(buscar(n, 'Cpf'));
  return {
    ...vazio('NFSE'),
    chaveAcesso: txt(buscar(inf, 'CodigoVerificacao')),
    numero: txt(buscar(inf, 'Numero')),
    dataEmissao: data(buscar(inf, 'DataEmissao')),
    emitenteDoc: docDe(prestador),
    emitenteNome: txt(buscar(prestador, 'RazaoSocial')),
    destinatarioDoc: docDe(tomador),
    destinatarioNome: txt(buscar(tomador, 'RazaoSocial')),
    valorTotal: num(buscar(inf, 'ValorServicos')),
    naturezaOperacao: txt(buscar(inf, 'Discriminacao'))?.slice(0, 200) ?? null,
    situacao: buscar(raiz, 'NfseCancelamento') ? 'CANCELADA' : 'AUTORIZADA',
  };
}

export function lerXmlFiscal(conteudo: Buffer): DadosLidos {
  let xml: Record<string, unknown>;
  try {
    xml = parser.parse(conteudo.toString('utf8').replace(/^﻿/, ''));
  } catch {
    return vazio('DESCONHECIDO');
  }

  const raizes: [string, (r: No) => DadosLidos | null][] = [
    ['nfeProc', lerNfe],
    ['NFe', (r) => lerNfe({ NFe: r })],
    ['cteProc', (r) => lerCte(r, false)],
    ['CTe', (r) => lerCte({ CTe: r }, false)],
    ['cteOSProc', (r) => lerCte(r, true)],
    ['CTeOS', (r) => lerCte({ CTeOS: r }, true)],
    ['mdfeProc', lerMdfe],
    ['MDFe', (r) => lerMdfe({ MDFe: r })],
    ['procEventoNFe', lerEvento],
    ['procEventoCTe', lerEvento],
    ['procEventoMDFe', lerEvento],
    ['NFSe', lerNfseNacional],
  ];
  for (const [tag, ler] of raizes) {
    if (xml[tag]) {
      const r = ler(no(xml[tag]));
      if (r) return r;
    }
  }
  return lerNfseAbrasf(xml) ?? vazio('DESCONHECIDO');
}

// Modelo pela chave de acesso (posições 21-22): usado para PDFs.
export function modeloPelaChave(chave: string | null): ModeloDocFiscal {
  const mod = chave?.length === 44 ? chave.slice(20, 22) : null;
  return ({ '55': 'NFE', '65': 'NFCE', '57': 'CTE', '67': 'CTEOS', '58': 'MDFE' } as Record<string, ModeloDocFiscal>)[mod ?? ''] ?? 'DESCONHECIDO';
}

// Dígito verificador (módulo 11) da chave de 44 posições.
export function chaveValida(chave: string) {
  if (!/^\d{44}$/.test(chave)) return false;
  let soma = 0;
  let peso = 2;
  for (let i = 42; i >= 0; i--) {
    soma += Number(chave[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  return dv === Number(chave[43]);
}

// Tenta achar a chave de 44 dígitos no nome do arquivo ou no texto do PDF.
export function chaveNoPdf(nomeArquivo: string, conteudo: Buffer): string | null {
  const candidatos = [
    ...(nomeArquivo.match(/\d{44}/g) ?? []),
    ...(conteudo.toString('latin1').replace(/(\d)[\s.]+(?=\d)/g, '$1').match(/\d{44}/g) ?? []).slice(0, 50),
  ];
  return candidatos.find((c) => chaveValida(c) && modeloPelaChave(c) !== 'DESCONHECIDO') ?? null;
}
