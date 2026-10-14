import type { Metadata } from 'next';
import Link from 'next/link';
import { Chakra_Petch } from 'next/font/google';
import {
  ArrowRight,
  Building2,
  Calculator,
  CalendarClock,
  Check,
  FileArchive,
  FilePenLine,
  Fingerprint,
  History,
  Kanban,
  Landmark,
  Lock,
  MessageCircle,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import RadarHud from '@/components/landing/radar-hud';
import Calculadora from '@/components/landing/calculadora';
import VideoTutorial from '@/components/landing/video-tutorial';
import Reveal from '@/components/landing/reveal';
import { CONFIG_PADRAO, formatarWhatsapp, type ConfigPlataforma } from '@/lib/tema';

const display = Chakra_Petch({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await carregarConfig();
  const preco = `R$ ${cfg.precoAVista.toLocaleString('pt-BR')} à vista ou ${cfg.parcelas}x de R$ ${cfg.valorParcela.toLocaleString('pt-BR')}`;
  return {
    title: { absolute: `${cfg.nomeSistema} · Nenhuma obrigação esquecida` },
    description: `Sistema para escritórios contábeis: agenda de obrigações automática, 200 modelos de documentos com IA, clientes importados pelo CNPJ e integrações com Receita, eSocial e SEFAZ. ${preco}.`,
    openGraph: {
      title: `${cfg.nomeSistema} · Nenhuma obrigação esquecida.`,
      description: 'Agenda de obrigações automática, modelos com IA e integrações com os órgãos para escritórios contábeis.',
      type: 'website',
      locale: 'pt_BR',
    },
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Nome, cores, WhatsApp e preço vêm da Aparência do Super Admin; se a API
// não responder, a página sai com os valores padrão.
async function carregarConfig(): Promise<ConfigPlataforma> {
  try {
    const res = await fetch(`${API_URL}/plataforma/config`, { next: { revalidate: 60 } });
    if (!res.ok) return CONFIG_PADRAO;
    return { ...CONFIG_PADRAO, ...(await res.json()) };
  } catch {
    return CONFIG_PADRAO;
  }
}

const reais = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

const MODULOS = [
  { icon: CalendarClock, tag: 'Agenda', titulo: 'Obrigações do mês em um clique', texto: 'DAS, FGTS, eSocial, DCTFWeb, EFD-Reinf, PIS/COFINS e IRPJ de cada cliente, conforme o regime, com prazos ajustados a fins de semana e feriados.', grande: true },
  { icon: Wallet, tag: 'DP', titulo: 'Folha de pagamento completa', texto: 'Holerites, férias, 13º, rescisões e pró-labore com INSS, IRRF e FGTS pelas tabelas de 2026, e pendências do eSocial.', grande: true },
  { icon: FilePenLine, tag: 'IA', titulo: '200 modelos com IA', texto: 'Contratos, declarações, procurações e requerimentos com os dados do cliente, em Word.' },
  { icon: Building2, tag: 'Receita', titulo: 'Carteira pelo CNPJ', texto: 'Cole a lista de CNPJs e os clientes entram com os dados da Receita.' },
  { icon: FileArchive, tag: 'Fiscal', titulo: 'Arquivo fiscal', texto: 'XML e PDF de NF-e, NFC-e, CT-e, MDF-e e NFS-e, vinculados ao cliente pelo CNPJ.' },
  { icon: Kanban, tag: 'Fluxo', titulo: 'Obrigações em kanban', texto: 'Pendente, em análise e entregue: a equipe vê o que falta.' },
  { icon: Landmark, tag: 'Gov', titulo: 'Pronto para os órgãos', texto: 'Integrações preparadas para SERPRO Integra Contador, eSocial, FGTS Digital e SEFAZ, com teste de conexão real.', grande: true },
  { icon: TrendingUp, tag: 'Índices', titulo: 'Consultas oficiais', texto: 'SELIC, IPCA, IGP-M, CDI e PTAX do Banco Central, NCM, IBGE, status da SEFAZ, CNPJ e CEP.', grande: true },
];

const PASSOS = [
  { n: '01', t: 'Fale com a gente', d: 'Mostramos o sistema ao vivo e configuramos o seu escritório.' },
  { n: '02', t: 'Importe a carteira', d: 'Cole os CNPJs dos clientes e o cadastro se completa com os dados da Receita.' },
  { n: '03', t: 'Gere o mês', d: 'Um clique cria as obrigações de todos os clientes, e a IA organiza a semana.' },
];

const ANTES = [
  'Planilha de vencimentos por cliente, atualizada à mão',
  'Folha conferida em calculadora e tabela impressa',
  'XMLs perdidos em e-mails e pastas',
  'Certificado A1 vencendo sem ninguém perceber',
  'Contrato e declaração redigidos do zero',
];
const DEPOIS = [
  'Obrigações geradas pelo regime, com o prazo legal',
  'INSS, IRRF e FGTS calculados pelas tabelas de 2026',
  'Arquivo fiscal organizado e vinculado pelo CNPJ',
  'Cofre A1 criptografado com alerta antes de vencer',
  '200 modelos preenchidos pela IA em segundos',
];

const MARQUEE = ['Receita Federal', 'SERPRO Integra Contador', 'eSocial', 'FGTS Digital', 'SEFAZ', 'Banco Central', 'NF-e · NFS-e · CT-e', 'Folha 2026', '200 modelos com IA', 'Cofre A1 AES-256'];

const faq = (preco: string, mensal: string) => [
  { p: 'Preciso instalar alguma coisa?', r: 'Não. O sistema roda no navegador, no computador e no celular. Nós cuidamos da instalação e da configuração.' },
  {
    p: 'Como funciona a agenda de obrigações?',
    r: 'Cada cliente tem um regime tributário e funcionários cadastrados. Com isso, o sistema gera as obrigações do mês com o prazo legal de cada uma, antecipando ou prorrogando conforme a regra quando o vencimento cai em fim de semana ou feriado nacional.',
  },
  {
    p: 'O sistema já envia declarações para a Receita?',
    r: 'As integrações com SERPRO Integra Contador, eSocial e SEFAZ estão preparadas no sistema e são entregues em etapas. Elas exigem o contrato do escritório com o SERPRO e o certificado digital A1. As consultas públicas (CNPJ, CEP, feriados e índices) já funcionam.',
  },
  { p: 'Os certificados digitais ficam seguros?', r: 'Sim. O arquivo e a senha são guardados criptografados (AES-256) e só são usados pelas integrações. Cada escritório só acessa os próprios dados.' },
  { p: 'Atende mais de um escritório?', r: 'Sim. O sistema é multiempresa: cada escritório tem os próprios clientes, usuários e dados separados.' },
  {
    p: 'Como funciona o pagamento do Plano Pro?',
    r: `${preco}, com 12 meses de suporte total incluídos. A partir do 13º mês, o contrato segue com mensalidade de ${mensal}.`,
  },
];

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--nx-cyan)]">
      <span className="h-px w-6 bg-[var(--nx-cyan)]" />
      {children}
    </p>
  );
}

export default async function Home() {
  const cfg = await carregarConfig();
  const WHATS = formatarWhatsapp(cfg.whatsapp);
  const zap = (msg: string) => `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
  const ZAP_COMPRAR = zap(`Olá! Vim pelo site e quero contratar o Plano Pro do ${cfg.nomeSistema}.`);
  const ZAP_DEMO = zap(`Olá! Vim pelo site e quero ver uma demonstração do ${cfg.nomeSistema}.`);
  const ZAP = zap(`Olá! Vim pelo site e quero conhecer o ${cfg.nomeSistema}.`);
  const AVISTA = reais(cfg.precoAVista);
  const PARCELADO = `${cfg.parcelas}x de ${reais(cfg.valorParcela)}`;
  const MENSAL = reais(cfg.valorParcela);
  const FAQ = faq(`${AVISTA} à vista ou ${PARCELADO}`, MENSAL);
  const [marca, ...resto] = cfg.nomeSistema.split(' ');
  const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

  return (
    <div className={`nx nx-scanlines min-h-screen overflow-x-hidden ${display.variable}`}>
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <nav className="mt-3 flex h-14 items-center justify-between rounded-2xl border border-[var(--nx-line)] bg-[#02040a]/75 px-4 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--nx-cyan)] to-[var(--nx-blue)] shadow-[0_0_24px_rgba(62,240,255,0.55)]">
                <Calculator size={16} className="text-[#001218]" />
              </span>
              <span className="nx-display text-lg font-semibold">
                {marca}
                <span className="hidden text-[var(--nx-cyan)] sm:inline"> {resto.join(' ')}</span>
              </span>
            </Link>
            <div className="hidden items-center gap-7 text-sm text-[var(--nx-mute)] lg:flex">
              <a href="#modulos" className="transition-colors hover:text-white">Módulos</a>
              <a href="#como-funciona" className="transition-colors hover:text-white">Como funciona</a>
              <a href="#calculadora" className="transition-colors hover:text-white">Calculadora</a>
              <a href="#planos" className="transition-colors hover:text-white">Preço</a>
              <a href="#faq" className="transition-colors hover:text-white">Dúvidas</a>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden px-3 py-2 text-sm text-[var(--nx-mute)] hover:text-white sm:block">Entrar</Link>
              <a href={ZAP_DEMO} {...ext} className="nx-btn inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold">
                Ver demonstração <ArrowRight size={15} />
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
        <div className="nx-grid absolute inset-0" />
        <div className="absolute left-1/2 top-[-320px] h-[700px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(43,107,255,0.35),transparent)] blur-3xl" />
        <div className="nx-floor absolute inset-x-[-20%] bottom-0 h-[45%] opacity-40" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="min-w-0">
            <p className="lp-rise inline-flex items-center gap-2 rounded-full border border-[var(--nx-cyan)]/30 bg-[var(--nx-cyan)]/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--nx-cyan)] sm:text-[11px]">
              <Zap size={12} /> Inteligência artificial para escritórios contábeis
            </p>
            <h1 className="lp-rise nx-display mt-7 text-[clamp(2.5rem,5.2vw,4.7rem)] font-bold leading-[0.98]" style={{ animationDelay: '120ms' }}>
              Nenhuma obrigação <span className="nx-glow">passa do prazo.</span>
            </h1>
            <p className="lp-rise mt-7 max-w-xl text-lg leading-relaxed text-[var(--nx-mute)]" style={{ animationDelay: '240ms' }}>
              Agenda fiscal automática, folha pelas tabelas de 2026, arquivo de notas e 200 modelos com IA.
              <span className="text-white"> Sua equipe entrega; o sistema vigia os prazos.</span>
            </p>
            <div className="lp-rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '360ms' }}>
              <a href={ZAP_DEMO} {...ext} className="nx-btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-7 py-4 text-base font-semibold">
                Agendar demonstração <ArrowRight size={18} />
              </a>
              <a href="#como-funciona" className="nx-btn-wa inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-6 py-4 text-base font-medium" style={{ borderColor: 'rgba(62,240,255,0.4)', background: 'rgba(62,240,255,0.06)', color: '#e6f0ff' }}>
                ▶ Ver o tutorial em vídeo
              </a>
            </div>
            <ul className="lp-rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--nx-mute)]" style={{ animationDelay: '480ms' }}>
              {['Sem instalar nada', 'Multiempresa', 'Implantação feita por nós'].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check size={15} className="text-[var(--nx-cyan)]" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="lp-rise min-w-0" style={{ animationDelay: '300ms' }}>
            <RadarHud />
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="relative border-y border-[var(--nx-line)] bg-[var(--nx-cyan)]/[0.02] py-5">
        <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="nx-marquee flex shrink-0 gap-12 pr-12">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-12 whitespace-nowrap font-mono text-xs uppercase tracking-[0.2em] text-white/50">
                {m}
                <span className="h-1 w-1 rotate-45 bg-[var(--nx-cyan)]" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="relative py-28">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--nx-amber)]">⚠ Alerta de risco</p>
            <h2 className="nx-display mt-5 text-[clamp(2.1rem,5vw,4rem)] font-semibold leading-[1.02]">
              Uma guia atrasada vira multa.
              <br />
              <span className="text-white/35">E multa vira cliente perdido.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--nx-mute)]">
              Dezenas de clientes, regimes diferentes e prazos que mudam com feriados. Quando tudo depende de planilha
              e memória, basta um mês corrido. O sistema não tem mês corrido.
            </p>
          </Reveal>
        </div>
      </section>

      {/* MÓDULOS */}
      <section id="modulos" className="scroll-mt-24 pb-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Rotulo>Módulos</Rotulo>
              <h2 className="nx-display mt-5 max-w-xl text-[clamp(2.1rem,4.5vw,3.5rem)] font-semibold leading-[1.02]">
                O escritório inteiro <span className="nx-glow">num só painel.</span>
              </h2>
            </div>
            <p className="max-w-sm text-[var(--nx-mute)]">
              Fiscal, pessoal, documentos, clientes e equipe conectados num só sistema, com novos módulos entregues por etapas.
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULOS.map((m, i) => (
              <Reveal key={m.titulo} delay={(i % 4) * 80} className={m.grande ? 'sm:col-span-2' : ''}>
                <div className="nx-frame nx-card group relative h-full min-h-[230px] overflow-hidden rounded-2xl p-7 transition duration-500 hover:border-[var(--nx-cyan)]/40">
                  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--nx-cyan)]/0 blur-3xl transition duration-700 group-hover:bg-[var(--nx-cyan)]/20" />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--nx-cyan)]/25 bg-[var(--nx-cyan)]/[0.06] text-[var(--nx-cyan)] transition group-hover:bg-[var(--nx-cyan)] group-hover:text-black">
                        <m.icon size={20} />
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">{m.tag}</span>
                    </div>
                    <h3 className={`nx-display mt-auto pt-10 font-semibold ${m.grande ? 'text-2xl' : 'text-lg'}`}>{m.titulo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--nx-mute)]">{m.texto}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="relative scroll-mt-24 overflow-hidden border-y border-[var(--nx-line)] py-28">
        <div className="nx-spin-slow absolute -right-[280px] top-40 h-[680px] w-[680px] rounded-full border border-dashed border-[var(--nx-cyan)]/15" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <Rotulo>Como funciona</Rotulo>
            <h2 className="nx-display mt-5 max-w-2xl text-[clamp(2.1rem,4.5vw,3.5rem)] font-semibold leading-[1.02]">
              Três passos. <span className="text-white/35">Depois, o sistema vigia por você.</span>
            </h2>
          </Reveal>
          <div className="relative mt-16 grid gap-6 md:grid-cols-3">
            {PASSOS.map((p, i) => (
              <Reveal key={p.n} delay={i * 140}>
                <div className="nx-frame nx-card relative h-full rounded-2xl p-8">
                  <span className="nx-display text-6xl font-bold leading-none text-transparent [-webkit-text-stroke:1px_rgba(62,240,255,0.6)]">{p.n}</span>
                  <h3 className="nx-display mt-8 text-xl font-semibold">{p.t}</h3>
                  <p className="mt-2 text-[var(--nx-mute)]">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-16">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--nx-cyan)]">▶ Tutorial em vídeo · 6 minutos</p>
            <VideoTutorial />
          </Reveal>
          <Reveal className="mt-12 text-center">
            <a href={ZAP_DEMO} {...ext} className="nx-btn inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-7 py-4 font-semibold">
              Quero ver no meu escritório <ArrowRight size={18} />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ANTES x DEPOIS */}
      <section className="py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="text-center">
            <Rotulo>Antes e depois</Rotulo>
            <h2 className="nx-display mt-5 text-[clamp(2.1rem,4.5vw,3.5rem)] font-semibold leading-[1.02]">
              A rotina do escritório, <span className="nx-glow">reprogramada.</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">Sem o sistema</p>
                <ul className="mt-6 space-y-4">
                  {ANTES.map((t) => (
                    <li key={t} className="flex items-start gap-3 text-white/50">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10"><X size={12} className="text-red-400" strokeWidth={3} /></span>
                      <span className="line-through decoration-white/20">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="nx-frame h-full rounded-2xl border border-[var(--nx-cyan)]/30 bg-gradient-to-b from-[var(--nx-cyan)]/[0.08] to-transparent p-8 shadow-[0_30px_100px_-40px_rgba(62,240,255,0.6)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--nx-cyan)]">Com o {cfg.nomeSistema}</p>
                <ul className="mt-6 space-y-4">
                  {DEPOIS.map((t) => (
                    <li key={t} className="flex items-start gap-3 text-white">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--nx-cyan)]/15"><Check size={12} className="text-[var(--nx-cyan)]" strokeWidth={3} /></span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CALCULADORA */}
      <section id="calculadora" className="scroll-mt-24 pb-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-12 max-w-2xl">
            <Rotulo>Calculadora</Rotulo>
            <h2 className="nx-display mt-5 text-[clamp(2.1rem,4.5vw,3.5rem)] font-semibold leading-[1.02]">
              Quanto custa o <span className="text-[var(--nx-amber)]">trabalho manual?</span>
            </h2>
            <p className="mt-4 text-[var(--nx-mute)]">Ajuste com a realidade do seu escritório.</p>
          </Reveal>
          <Reveal>
            <Calculadora cadastro={ZAP_DEMO} whatsapp={ZAP} preco={cfg.precoAVista} />
          </Reveal>
        </div>
      </section>

      {/* SEGURANÇA */}
      <section id="seguranca" className="scroll-mt-24 pb-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="nx-frame relative overflow-hidden rounded-3xl border border-[var(--nx-line)] bg-gradient-to-br from-[#06102a] to-[#02040a] p-8 sm:p-14">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_80%_20%,rgba(43,107,255,0.3),transparent_60%)]" />
              <div className="relative grid gap-12 lg:grid-cols-[1fr_1.2fr]">
                <div>
                  <ShieldCheck size={34} className="text-[var(--nx-cyan)]" />
                  <h2 className="nx-display mt-6 text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1.05]">
                    Dados fiscais <span className="text-white/35">em nível de cofre.</span>
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {[
                    { i: Lock, t: 'Certificados criptografados', d: 'Arquivo A1 e senha guardados com AES-256 e usados só pelas integrações.' },
                    { i: Users, t: 'Permissões por usuário', d: 'Cada pessoa da equipe acessa só os módulos liberados para ela.' },
                    { i: History, t: 'Escritórios isolados', d: 'Multiempresa: cada escritório vê apenas os próprios clientes e dados.' },
                    { i: Fingerprint, t: 'Acesso controlado', d: 'Contas criadas pela nossa equipe, com licença e validade por escritório.' },
                  ].map((x) => (
                    <div key={x.t} className="border-l border-[var(--nx-cyan)]/25 pl-5">
                      <x.i size={18} className="text-[var(--nx-cyan)]" />
                      <p className="mt-3 font-medium">{x.t}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--nx-mute)]">{x.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="scroll-mt-24 pb-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="text-center">
            <Rotulo>Preço</Rotulo>
            <h2 className="nx-display mt-5 text-[clamp(2.1rem,4.5vw,3.5rem)] font-semibold leading-[1.02]">
              Um plano completo. <span className="text-white/35">Sem módulo escondido.</span>
            </h2>
          </Reveal>
          <Reveal className="mx-auto mt-16 max-w-3xl">
            <div className="nx-frame relative overflow-hidden rounded-3xl border border-[var(--nx-cyan)]/45 bg-gradient-to-b from-[#06213a] to-[#02040a] p-8 shadow-[0_40px_140px_-30px_rgba(62,240,255,0.55)] sm:p-10">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--nx-cyan)]/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--nx-cyan)]">Plano Pro</p>
                  <span className="rounded-full bg-[var(--nx-amber)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black">Completo</span>
                </div>
                <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="nx-display text-6xl font-bold sm:text-7xl">{AVISTA}</span>
                  <span className="text-[var(--nx-mute)]">à vista</span>
                </p>
                <p className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--nx-cyan)]/30 bg-[var(--nx-cyan)]/10 px-3 py-1 text-sm">
                  ou <b className="text-[var(--nx-cyan)]">{PARCELADO}</b>
                </p>
                <ul className="mt-8 grid gap-3 text-sm text-white/85 sm:grid-cols-2">
                  {['Agenda de obrigações automática', 'Folha, férias, 13º e rescisões', 'Arquivo fiscal (XML e PDF)', '200 modelos com IA', 'Carteira importada pelo CNPJ', 'Cofre de certificados A1', 'Integrações com os órgãos', '12 meses de suporte total'].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--nx-cyan)]/15"><Check size={12} className="text-[var(--nx-cyan)]" strokeWidth={3} /></span>
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/70">
                  A partir do 13º mês: <b className="text-white">{MENSAL}/mês</b>, conforme contrato.
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href={ZAP_COMPRAR} {...ext} className="nx-btn inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-6 py-4 font-semibold">
                    <MessageCircle size={18} /> Contratar pelo WhatsApp
                  </a>
                  <a href={ZAP_DEMO} {...ext} className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 px-6 py-4 font-medium transition hover:border-[var(--nx-cyan)]/50">
                    Ver demonstração antes <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 pb-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <Rotulo>Dúvidas</Rotulo>
            <h2 className="nx-display mt-5 text-[clamp(2.1rem,4.5vw,3.5rem)] font-semibold leading-[1.02]">
              Perguntas <span className="text-white/35">frequentes.</span>
            </h2>
            <p className="mt-4 text-[var(--nx-mute)]">Ficou alguma dúvida? Um especialista responde no WhatsApp.</p>
            <a href={ZAP} {...ext} className="nx-btn-wa mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium">
              <MessageCircle size={17} className="text-[var(--nx-wa)]" /> {WHATS}
            </a>
          </Reveal>
          <div className="divide-y divide-[var(--nx-line)] border-y border-[var(--nx-line)]">
            {FAQ.map((f) => (
              <details key={f.p} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {f.p}
                  <Plus size={20} className="shrink-0 text-white/40 transition-transform duration-300 group-open:rotate-45 group-open:text-[var(--nx-cyan)]" />
                </summary>
                <p className="mt-4 max-w-2xl leading-relaxed text-[var(--nx-mute)]">{f.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 pb-28 sm:px-8">
        <Reveal>
          <div className="nx-frame relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-[var(--nx-cyan)]/30 bg-[#020a18] px-8 py-20 text-center sm:py-28">
            <div className="nx-floor absolute inset-x-[-20%] bottom-0 h-1/2 opacity-60" />
            <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(62,240,255,0.35),transparent)] blur-2xl" />
            <div className="relative">
              <h2 className="nx-display mx-auto max-w-3xl text-[clamp(2.4rem,6vw,5rem)] font-bold leading-[0.95]">
                O próximo vencimento <span className="nx-glow">já está na agenda.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-lg text-white/65">Veja o sistema funcionando com a realidade do seu escritório.</p>
              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={ZAP_DEMO} {...ext} className="nx-btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-8 py-4 text-base font-semibold">
                  Agendar demonstração <ArrowRight size={18} />
                </a>
                <a href={ZAP} {...ext} className="nx-btn-wa inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-7 py-4 text-base font-medium">
                  <MessageCircle size={18} className="text-[var(--nx-wa)]" /> Falar com especialista
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* WhatsApp flutuante */}
      <a href={ZAP} {...ext} aria-label="Falar no WhatsApp" className="group fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-[var(--nx-wa)] p-3.5 text-black shadow-[0_10px_40px_-5px_rgba(37,211,102,0.7)] transition-all hover:pr-5 sm:bottom-6 sm:right-6">
        <span className="nx-ping absolute inset-0 rounded-full bg-[var(--nx-wa)]/40" />
        <MessageCircle size={24} strokeWidth={2.2} className="relative" />
        <span className="relative max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[180px]">Falar com especialista</span>
      </a>

      {/* Barra fixa no celular */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--nx-line)] bg-[#02040a]/90 p-3 backdrop-blur-xl sm:hidden">
        <a href={ZAP_DEMO} {...ext} className="nx-btn flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold">
          Agendar demonstração <ArrowRight size={17} />
        </a>
      </div>

      {/* RODAPÉ */}
      <footer className="border-t border-[var(--nx-line)] pb-20 sm:pb-0">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-white/40 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2"><Calculator size={15} /> {cfg.nomeSistema}</div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-white">Entrar</Link>
            <a href={ZAP} {...ext} className="hover:text-white">WhatsApp</a>
          </div>
          <p>© {new Date().getFullYear()} {cfg.nomeSistema}</p>
        </div>
      </footer>
    </div>
  );
}
