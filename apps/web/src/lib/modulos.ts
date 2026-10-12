import {
  ArrowLeftRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bot,
  Building2,
  Calculator,
  CalendarClock,
  CalendarDays,
  Crown,
  Download,
  FileCheck2,
  FileCode2,
  FilePenLine,
  FolderUp,
  UsersRound,
  FileSpreadsheet,
  FileText,
  HandCoins,
  HeartPulse,
  Kanban,
  Landmark,
  Layers,
  LayoutDashboard,
  ListTree,
  Mail,
  Network,
  Palmtree,
  Paperclip,
  PieChart,
  PiggyBank,
  Plug,
  Receipt,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Store,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

// Mapa de todas as abas do sistema. `href` aponta para uma tela própria
// quando o módulo já está no ar; os demais abrem /dashboard/m/[slug], que
// mostra o escopo, a etapa de entrega e as integrações de que dependem.

export interface Modulo {
  slug: string;
  titulo: string;
  icone: LucideIcon;
  href?: string;
  etapa: number;
  resumo: string;
  recursos?: string[];
  // ids do catálogo de integrações da API (/integracoes/catalogo)
  conectores?: string[];
  // Permissão exigida para ver a aba (src/auth/permissoes.ts na API).
  perm?: string;
}

export interface GrupoModulos {
  grupo: string;
  modulos: Modulo[];
}

export const GRUPOS: GrupoModulos[] = [
  {
    grupo: 'Visão geral',
    modulos: [
      { slug: 'painel', titulo: 'Painel', icone: LayoutDashboard, href: '/dashboard', etapa: 1, resumo: 'Indicadores do escritório.' },
      { slug: 'agenda', perm: 'obrigacoes', titulo: 'Agenda', icone: CalendarDays, href: '/dashboard/agenda', etapa: 1, resumo: 'Compromissos com clientes.' },
      { slug: 'obrigacoes', perm: 'obrigacoes', titulo: 'Obrigações', icone: Kanban, href: '/dashboard/obrigacoes', etapa: 1, resumo: 'Kanban das obrigações fiscais.' },
      { slug: 'calendario', perm: 'obrigacoes', titulo: 'Agenda inteligente', icone: CalendarClock, href: '/dashboard/calendario', etapa: 1, resumo: 'Obrigações do mês geradas por regime, com feriados e plano da IA.' },
      { slug: 'assistente', perm: 'ia', titulo: 'Assistente IA', icone: Bot, href: '/dashboard/assistente', etapa: 1, resumo: 'IA no painel.' },
      { slug: 'modelos', perm: 'ia', titulo: 'Modelos com IA', icone: FilePenLine, href: '/dashboard/modelos', etapa: 1, resumo: '200 modelos de documentos contábeis preenchidos pela IA.' },
    ],
  },
  {
    grupo: 'Cadastros',
    modulos: [
      { slug: 'clientes', perm: 'clientes.ver', titulo: 'Clientes', icone: Building2, href: '/dashboard/clients', etapa: 1, resumo: 'Empresas atendidas.' },
      { slug: 'importar', perm: 'clientes.gerenciar', titulo: 'Importar clientes', icone: Upload, href: '/dashboard/importar', etapa: 1, resumo: 'Cadastro em lote por CNPJ.' },
      { slug: 'funcionarios', perm: 'pessoal', titulo: 'Funcionários', icone: Users, href: '/dashboard/funcionarios', etapa: 1, resumo: 'Funcionários de todos os clientes.' },
      { slug: 'documentos', perm: 'documentos', titulo: 'Documentos', icone: Paperclip, href: '/dashboard/documentos', etapa: 1, resumo: 'Arquivos de todos os clientes.' },
      { slug: 'certificados', perm: 'certificados', titulo: 'Certificados A1', icone: ShieldCheck, href: '/dashboard/certificados', etapa: 1, resumo: 'Cofre de certificados digitais.' },
    ],
  },
  {
    grupo: 'Fiscal e SEFAZ',
    modulos: [
      { slug: 'arquivo-fiscal', perm: 'fiscal.ver', titulo: 'Arquivo fiscal (XML e PDF)', icone: FolderUp, href: '/dashboard/arquivo-fiscal', etapa: 1, resumo: 'Upload de XML e PDF de NF-e, NFC-e, CT-e, MDF-e e NFS-e.' },
      { slug: 'notas', perm: 'fiscal.ver', titulo: 'NF-e e NFC-e', icone: Receipt, href: '/dashboard/notas', etapa: 1, resumo: 'Notas emitidas via SEFAZ.', conectores: ['focus-nfe'] },
      {
        slug: 'nfse', perm: 'fiscal.ver',
        titulo: 'NFS-e',
        icone: FileText,
        etapa: 3,
        resumo: 'Notas de serviço no padrão nacional e nas prefeituras.',
        recursos: ['Emissão de NFS-e pelo padrão nacional', 'Prefeituras não aderentes via gateway', 'Cancelamento e substituição', 'Retenções de ISS, IR, PIS, COFINS e CSLL'],
        conectores: ['nuvem-fiscal'],
      },
      {
        slug: 'notas-recebidas', perm: 'fiscal.ver',
        titulo: 'Notas recebidas',
        icone: Download,
        etapa: 3,
        resumo: 'Notas emitidas contra o CNPJ do cliente, baixadas da SEFAZ.',
        recursos: ['Distribuição DF-e automática', 'Manifestação do destinatário', 'Download de XML e DANFE', 'Alerta de nota desconhecida'],
        conectores: ['sefaz-dfe', 'nuvem-fiscal'],
      },
      {
        slug: 'apuracao', perm: 'fiscal.ver',
        titulo: 'Apuração de impostos',
        icone: Calculator,
        etapa: 3,
        resumo: 'Cálculo de ICMS, PIS, COFINS, IRPJ e CSLL a partir das notas.',
        recursos: ['Apuração por regime tributário', 'Créditos e débitos de ICMS', 'Lucro Presumido trimestral', 'Memória de cálculo exportável'],
      },
      {
        slug: 'sped', perm: 'fiscal.ver',
        titulo: 'SPED Fiscal',
        icone: FileSpreadsheet,
        etapa: 4,
        resumo: 'EFD ICMS/IPI e EFD-Contribuições gerados a partir dos dados do sistema.',
        recursos: ['EFD ICMS/IPI', 'EFD-Contribuições', 'Validação antes do PVA', 'Histórico de entregas'],
      },
    ],
  },
  {
    grupo: 'Receita Federal',
    modulos: [
      {
        slug: 'simples', perm: 'fiscal.ver',
        titulo: 'Simples Nacional',
        icone: Landmark,
        etapa: 3,
        resumo: 'PGDAS-D, DAS e DEFIS pelo Integra Contador.',
        recursos: ['Transmissão do PGDAS-D', 'Emissão do DAS', 'Consulta de declarações e pagamentos', 'DEFIS anual'],
        conectores: ['serpro-integra-contador'],
      },
      {
        slug: 'mei', perm: 'fiscal.ver',
        titulo: 'MEI',
        icone: Store,
        etapa: 3,
        resumo: 'DAS-MEI e DASN-SIMEI dos clientes MEI.',
        recursos: ['Emissão do DAS-MEI', 'DASN-SIMEI anual', 'Consulta de débitos'],
        conectores: ['serpro-integra-contador'],
      },
      {
        slug: 'dctfweb', perm: 'fiscal.ver',
        titulo: 'DCTFWeb',
        icone: FileCheck2,
        etapa: 3,
        resumo: 'Declaração de débitos previdenciários e emissão do DARF.',
        recursos: ['Consulta de declarações', 'Transmissão', 'Emissão do DARF', 'MIT (débitos não previdenciários)'],
        conectores: ['serpro-integra-contador'],
      },
      {
        slug: 'certidoes', perm: 'fiscal.ver',
        titulo: 'Certidões (CND)',
        icone: BadgeCheck,
        etapa: 3,
        resumo: 'Situação fiscal e certidões negativas de cada cliente.',
        recursos: ['Relatório de situação fiscal', 'CND federal', 'Alerta de pendência nova', 'Validade das certidões'],
        conectores: ['serpro-integra-contador'],
      },
      {
        slug: 'caixa-postal', perm: 'fiscal.ver',
        titulo: 'Caixa postal e-CAC',
        icone: Mail,
        etapa: 3,
        resumo: 'Mensagens da Receita para todos os clientes num lugar só.',
        recursos: ['Leitura das mensagens', 'Alerta de intimação', 'Histórico por cliente'],
        conectores: ['serpro-integra-contador'],
      },
      {
        slug: 'parcelamentos', perm: 'fiscal.ver',
        titulo: 'Parcelamentos',
        icone: Layers,
        etapa: 3,
        resumo: 'Parcelamentos do Simples, MEI e previdenciários.',
        recursos: ['Consulta de parcelamentos ativos', 'Emissão da parcela', 'Alerta de parcela em atraso'],
        conectores: ['serpro-integra-contador'],
      },
    ],
  },
  {
    grupo: 'Trabalhista',
    modulos: [
      {
        slug: 'folha', perm: 'pessoal',
        titulo: 'Folha de pagamento',
        icone: Banknote,
        etapa: 2,
        resumo: 'Cálculo mensal com proventos, descontos, INSS, IRRF e FGTS.',
        recursos: ['Tabelas de INSS e IRRF atualizadas', 'Holerite em PDF', 'Adiantamento e 13º', 'Envio para o eSocial'],
        conectores: ['esocial'],
      },
      {
        slug: 'esocial', perm: 'pessoal',
        titulo: 'eSocial',
        icone: Network,
        etapa: 2,
        resumo: 'Envio e acompanhamento dos eventos do eSocial.',
        recursos: ['Eventos de tabela, admissão e desligamento', 'S-1200 e S-1299', 'Recibos e retornos', 'Assinatura com certificado A1'],
        conectores: ['esocial'],
      },
      {
        slug: 'inss', perm: 'pessoal',
        titulo: 'INSS',
        icone: HeartPulse,
        etapa: 2,
        resumo: 'Contribuições previdenciárias e DARF pela DCTFWeb.',
        recursos: ['INSS patronal e dos segurados', 'Pró-labore e autônomos', 'Conferência com a DCTFWeb', 'Emissão do DARF'],
        conectores: ['inss-previdencia', 'esocial'],
      },
      {
        slug: 'fgts', perm: 'pessoal',
        titulo: 'FGTS Digital',
        icone: PiggyBank,
        etapa: 2,
        resumo: 'FGTS mensal e rescisório a partir do eSocial.',
        recursos: ['Conferência do FGTS por funcionário', 'Guia GFD', 'FGTS rescisório e multa'],
        conectores: ['fgts-digital', 'esocial'],
      },
      {
        slug: 'ferias-rescisoes', perm: 'pessoal',
        titulo: 'Férias e rescisões',
        icone: Palmtree,
        etapa: 2,
        resumo: 'Cálculo de férias, 13º e rescisões.',
        recursos: ['Controle de períodos aquisitivos', 'Aviso e recibo de férias', 'Termo de rescisão', 'Envio ao eSocial'],
        conectores: ['esocial'],
      },
      {
        slug: 'pro-labore', perm: 'pessoal',
        titulo: 'Pró-labore',
        icone: Crown,
        etapa: 2,
        resumo: 'Pró-labore dos sócios com INSS e IRRF.',
        recursos: ['Recibo de pró-labore', 'INSS de contribuinte individual', 'Distribuição de lucros'],
        conectores: ['esocial'],
      },
    ],
  },
  {
    grupo: 'Contábil',
    modulos: [
      {
        slug: 'plano-contas', perm: 'clientes.ver',
        titulo: 'Plano de contas',
        icone: ListTree,
        etapa: 4,
        resumo: 'Plano de contas referencial e por cliente.',
        recursos: ['Modelo padrão pronto', 'Mapeamento para o referencial da Receita', 'Personalização por cliente'],
      },
      {
        slug: 'lancamentos-contabeis', perm: 'clientes.ver',
        titulo: 'Lançamentos contábeis',
        icone: ArrowLeftRight,
        etapa: 4,
        resumo: 'Partidas dobradas, integradas com fiscal, folha e financeiro.',
        recursos: ['Lançamento manual e por lote', 'Integração automática com notas e folha', 'Importação de extrato (OFX)', 'Conciliação bancária'],
      },
      {
        slug: 'balancete', perm: 'clientes.ver',
        titulo: 'Balancete',
        icone: Scale,
        etapa: 4,
        resumo: 'Balancete de verificação por período.',
        recursos: ['Balancete mensal e acumulado', 'Razão e diário', 'Exportação em PDF e Excel'],
      },
      {
        slug: 'demonstracoes', perm: 'clientes.ver',
        titulo: 'DRE e Balanço',
        icone: PieChart,
        etapa: 4,
        resumo: 'Demonstrações contábeis prontas para o cliente.',
        recursos: ['DRE', 'Balanço patrimonial', 'Comparativo entre períodos', 'Indicadores financeiros'],
      },
      {
        slug: 'ecd-ecf', perm: 'clientes.ver',
        titulo: 'ECD e ECF',
        icone: FileCode2,
        etapa: 4,
        resumo: 'Escrituração contábil e fiscal anuais.',
        recursos: ['Geração do arquivo da ECD', 'Geração do arquivo da ECF', 'Validação prévia'],
      },
    ],
  },
  {
    grupo: 'Financeiro',
    modulos: [
      { slug: 'financeiro', perm: 'financeiro', titulo: 'Contas a pagar e receber', icone: Wallet, href: '/dashboard/financeiro', etapa: 1, resumo: 'Lançamentos de todos os clientes.', conectores: ['asaas'] },
      {
        slug: 'honorarios', perm: 'financeiro',
        titulo: 'Honorários',
        icone: HandCoins,
        etapa: 4,
        resumo: 'Cobrança recorrente dos honorários do escritório.',
        recursos: ['Contrato e valor por cliente', 'Boleto e Pix automáticos', 'Régua de cobrança', 'Reajuste anual por índice'],
        conectores: ['asaas', 'bcb-sgs'],
      },
    ],
  },
  {
    grupo: 'Ferramentas',
    modulos: [
      { slug: 'consultas', titulo: 'Consultas CNPJ e CEP', icone: Search, href: '/dashboard/consultas', etapa: 1, resumo: 'Dados públicos da Receita e dos Correios.', conectores: ['brasilapi-cnpj', 'brasilapi-cep'] },
      { slug: 'indices', titulo: 'Índices econômicos', icone: TrendingUp, href: '/dashboard/indices', etapa: 1, resumo: 'SELIC, CDI, IPCA, INPC e IGP-M.', conectores: ['bcb-sgs'] },
      { slug: 'integracoes', perm: 'integracoes', titulo: 'Integrações', icone: Plug, href: '/dashboard/integracoes', etapa: 1, resumo: 'Conexão com os órgãos.' },
      {
        slug: 'relatorios', perm: 'clientes.ver',
        titulo: 'Relatórios',
        icone: BarChart3,
        etapa: 4,
        resumo: 'Relatórios gerenciais do escritório e dos clientes.',
        recursos: ['Produtividade da equipe', 'Obrigações entregues no prazo', 'Faturamento por cliente', 'Exportação em PDF e Excel'],
      },
    ],
  },
  {
    grupo: 'Escritório',
    modulos: [
      { slug: 'equipe', perm: 'equipe', titulo: 'Equipe e permissões', icone: UsersRound, href: '/dashboard/equipe', etapa: 1, resumo: 'Usuários do escritório e o que cada um pode fazer.' },
      { slug: 'configuracoes', titulo: 'Configurações', icone: Settings, href: '/dashboard/settings', etapa: 1, resumo: 'Senha e chaves de integração.' },
    ],
  },
];

export const TODOS_MODULOS = GRUPOS.flatMap((g) => g.modulos);

export function moduloPorSlug(slug: string) {
  return TODOS_MODULOS.find((m) => m.slug === slug);
}

export function hrefDo(m: Modulo) {
  return m.href ?? `/dashboard/m/${m.slug}`;
}
