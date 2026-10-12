// Catálogo das integrações com órgãos e serviços. O status de cada uma é
// calculado em IntegracoesService.catalogo() a partir do que o escritório
// já configurou (chaves e certificados).

export type Requisito =
  | 'nenhum'
  | 'focusNfe'
  | 'asaas'
  | 'nuvemFiscal'
  | 'serpro'
  | 'certificadoEscritorio'
  | 'certificadoCliente'
  | 'openai';

export interface ConectorDef {
  id: string;
  nome: string;
  orgao: string;
  categoria: 'Receita Federal' | 'Trabalhista' | 'SEFAZ e notas' | 'Financeiro' | 'Consultas públicas' | 'Inteligência';
  descricao: string;
  servicos: string[];
  requisitos: Requisito[];
  // Etapa em que a tela que usa a integração entra no ar (1 = já disponível).
  etapa: number;
  site: string;
}

export const CONECTORES: ConectorDef[] = [
  {
    id: 'brasilapi-cnpj',
    nome: 'Consulta CNPJ',
    orgao: 'Receita Federal (dados abertos via BrasilAPI)',
    categoria: 'Consultas públicas',
    descricao: 'Razão social, endereço, CNAE, sócios e situação cadastral a partir do CNPJ.',
    servicos: ['Autopreenchimento de clientes', 'Quadro societário', 'Situação cadastral'],
    requisitos: ['nenhum'],
    etapa: 1,
    site: 'https://brasilapi.com.br',
  },
  {
    id: 'brasilapi-cep',
    nome: 'Consulta CEP',
    orgao: 'Correios (via BrasilAPI)',
    categoria: 'Consultas públicas',
    descricao: 'Endereço completo a partir do CEP.',
    servicos: ['Busca de endereço'],
    requisitos: ['nenhum'],
    etapa: 1,
    site: 'https://brasilapi.com.br',
  },
  {
    id: 'brasilapi-feriados',
    nome: 'Feriados nacionais',
    orgao: 'BrasilAPI',
    categoria: 'Consultas públicas',
    descricao: 'Feriados nacionais do ano, usados no calendário fiscal para ajustar prazos.',
    servicos: ['Calendário fiscal'],
    requisitos: ['nenhum'],
    etapa: 1,
    site: 'https://brasilapi.com.br',
  },
  {
    id: 'bcb-sgs',
    nome: 'Índices econômicos',
    orgao: 'Banco Central do Brasil (SGS)',
    categoria: 'Consultas públicas',
    descricao: 'SELIC, IPCA, INPC, IGP-M e CDI oficiais para correção de valores e cálculo de juros.',
    servicos: ['Índices econômicos', 'Correção de débitos'],
    requisitos: ['nenhum'],
    etapa: 1,
    site: 'https://www.bcb.gov.br/estabilidadefinanceira/sgs',
  },
  {
    id: 'serpro-integra-contador',
    nome: 'Integra Contador',
    orgao: 'Receita Federal (SERPRO)',
    categoria: 'Receita Federal',
    descricao:
      'API oficial da Receita para escritórios contábeis, por procuração eletrônica. Paga por consulta, exige contrato no SERPRO e e-CNPJ A1 do escritório.',
    servicos: [
      'Simples Nacional: PGDAS-D, DAS e DEFIS',
      'MEI: DAS-MEI e DASN-SIMEI',
      'DCTFWeb e MIT',
      'Situação fiscal e certidões (CND)',
      'Caixa postal do e-CAC',
      'Parcelamentos',
      'Procurações eletrônicas',
    ],
    requisitos: ['serpro', 'certificadoEscritorio'],
    etapa: 3,
    site: 'https://loja.serpro.gov.br/integracontador',
  },
  {
    id: 'esocial',
    nome: 'eSocial',
    orgao: 'Governo Federal (INSS, FGTS, Receita, MTE)',
    categoria: 'Trabalhista',
    descricao:
      'Envio dos eventos trabalhistas e previdenciários direto no webservice do eSocial, assinados com certificado A1.',
    servicos: ['Admissões e desligamentos (S-2200, S-2299)', 'Folha (S-1200) e fechamento (S-1299)', 'Base do INSS e da DCTFWeb', 'Base do FGTS Digital'],
    requisitos: ['certificadoEscritorio'],
    etapa: 2,
    site: 'https://www.gov.br/esocial',
  },
  {
    id: 'fgts-digital',
    nome: 'FGTS Digital',
    orgao: 'Ministério do Trabalho e Emprego / CAIXA',
    categoria: 'Trabalhista',
    descricao:
      'Guias do FGTS (GFD) a partir dos dados de remuneração enviados ao eSocial. Emissão da guia no portal com o certificado do procurador.',
    servicos: ['Conferência do FGTS mensal', 'Guia GFD', 'FGTS rescisório'],
    requisitos: ['certificadoEscritorio'],
    etapa: 2,
    site: 'https://fgtsdigital.sistema.gov.br',
  },
  {
    id: 'inss-previdencia',
    nome: 'INSS / Previdência',
    orgao: 'Receita Federal (DCTFWeb) e INSS',
    categoria: 'Trabalhista',
    descricao:
      'Contribuições previdenciárias apuradas a partir do eSocial e da EFD-Reinf. A guia (DARF previdenciário) sai pela DCTFWeb no Integra Contador.',
    servicos: ['Cálculo de INSS da folha', 'DARF previdenciário via DCTFWeb', 'Pró-labore e contribuinte individual'],
    requisitos: ['serpro', 'certificadoEscritorio'],
    etapa: 2,
    site: 'https://www.gov.br/inss',
  },
  {
    id: 'focus-nfe',
    nome: 'Focus NFe',
    orgao: 'SEFAZ estaduais (via gateway)',
    categoria: 'SEFAZ e notas',
    descricao: 'Emissão de NF-e e NFC-e com transmissão para a SEFAZ do estado do cliente.',
    servicos: ['NF-e', 'NFC-e', 'Cancelamento e carta de correção'],
    requisitos: ['focusNfe'],
    etapa: 1,
    site: 'https://focusnfe.com.br',
  },
  {
    id: 'nuvem-fiscal',
    nome: 'Nuvem Fiscal',
    orgao: 'SEFAZ e prefeituras (via gateway)',
    categoria: 'SEFAZ e notas',
    descricao: 'NFS-e (padrão nacional e prefeituras), CT-e, MDF-e e distribuição de notas recebidas.',
    servicos: ['NFS-e', 'CT-e e MDF-e', 'Notas recebidas (DF-e)'],
    requisitos: ['nuvemFiscal'],
    etapa: 3,
    site: 'https://www.nuvemfiscal.com.br',
  },
  {
    id: 'sefaz-dfe',
    nome: 'Distribuição DF-e',
    orgao: 'SEFAZ Nacional (Ambiente Nacional)',
    categoria: 'SEFAZ e notas',
    descricao:
      'Baixa automática das notas emitidas contra o CNPJ do cliente e manifestação do destinatário, direto no webservice da SEFAZ.',
    servicos: ['Notas de entrada', 'Manifestação do destinatário', 'Download de XML'],
    requisitos: ['certificadoCliente'],
    etapa: 3,
    site: 'https://www.nfe.fazenda.gov.br',
  },
  {
    id: 'asaas',
    nome: 'Asaas',
    orgao: 'Banco / cobranças',
    categoria: 'Financeiro',
    descricao: 'Boletos e Pix para cobrança de honorários e contas a receber.',
    servicos: ['Boleto', 'Pix', 'Baixa automática'],
    requisitos: ['asaas'],
    etapa: 1,
    site: 'https://www.asaas.com',
  },
  {
    id: 'openai',
    nome: 'Assistente de IA',
    orgao: 'OpenAI',
    categoria: 'Inteligência',
    descricao: 'Assistente no painel para dúvidas, redação e organização.',
    servicos: ['Assistente IA'],
    requisitos: ['openai'],
    etapa: 1,
    site: 'https://platform.openai.com',
  },
];

export const ROTULO_REQUISITO: Record<Requisito, string> = {
  nenhum: 'Gratuito, sem cadastro',
  focusNfe: 'Token do Focus NFe',
  asaas: 'Chave de API do Asaas',
  nuvemFiscal: 'Client ID e Secret da Nuvem Fiscal',
  serpro: 'Consumer Key e Secret do SERPRO',
  certificadoEscritorio: 'Certificado A1 do escritório',
  certificadoCliente: 'Certificado A1 do cliente',
  openai: 'Chave da OpenAI (plataforma)',
};
