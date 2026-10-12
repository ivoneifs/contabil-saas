import type { Metadata } from 'next';
import Link from 'next/link';
import { Instrument_Serif } from 'next/font/google';
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Building2,
  Calculator,
  CalendarClock,
  Check,
  FilePenLine,
  Kanban,
  Landmark,
  MessageCircle,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import FluxoAoVivo from '@/components/landing/fluxo-ao-vivo';
import Reveal from '@/components/landing/reveal';
import { CONFIG_PADRAO, cssTema, formatarWhatsapp, type ConfigPlataforma } from '@/lib/tema';

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

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

const RECURSOS = [
  {
    icon: CalendarClock,
    titulo: 'Agenda de obrigações automática',
    texto:
      'Um clique gera DAS, FGTS, eSocial, DCTFWeb, EFD-Reinf, PIS/COFINS e IRPJ de cada cliente, conforme o regime, com prazos ajustados a fins de semana e feriados.',
    grande: true,
  },
  {
    icon: FilePenLine,
    titulo: '200 modelos com IA',
    texto:
      'Contratos, declarações, procurações, cartas, documentos trabalhistas e requerimentos redigidos pela IA com os dados do cliente, prontos para baixar em Word.',
    grande: true,
  },
  {
    icon: Building2,
    titulo: 'Carteira importada pelo CNPJ',
    texto: 'Cole a lista de CNPJs e o sistema cadastra todos com os dados da Receita.',
  },
  {
    icon: Kanban,
    titulo: 'Obrigações em kanban',
    texto: 'Pendente, em análise e entregue: a equipe vê o que falta num olhar.',
  },
  {
    icon: Bot,
    titulo: 'Assistente e plano da semana',
    texto: 'A IA distribui o trabalho da semana e tira dúvidas sem sair do sistema.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Cofre de certificados A1',
    texto: 'Certificados e senhas criptografados, com alerta antes de vencer.',
  },
  {
    icon: Landmark,
    titulo: 'Pronto para os órgãos',
    texto:
      'Integrações preparadas para SERPRO Integra Contador, eSocial, FGTS Digital e SEFAZ: ligam assim que você cadastra a credencial do escritório.',
    grande: true,
  },
  {
    icon: TrendingUp,
    titulo: 'Índices e consultas oficiais',
    texto: 'SELIC, IPCA, INPC, IGP-M e CDI do Banco Central, e consulta completa de CNPJ e CEP.',
    grande: true,
  },
];

const PASSOS = [
  { n: '01', titulo: 'Fale com a gente', texto: 'Mostramos o sistema ao vivo e configuramos o seu escritório.' },
  { n: '02', titulo: 'Importe a carteira', texto: 'Cole os CNPJs dos clientes e o cadastro se completa com os dados da Receita.' },
  { n: '03', titulo: 'Gere o mês', texto: 'Um clique cria as obrigações de todos os clientes; a IA organiza a semana.' },
];

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

export default async function Home() {
  const cfg = await carregarConfig();
  const WHATSAPP_EXIBICAO = formatarWhatsapp(cfg.whatsapp);
  const zap = (msg: string) => `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
  const ZAP_COMPRAR = zap(`Olá! Vim pelo site e quero contratar o Plano Pro do ${cfg.nomeSistema}.`);
  const ZAP_DEMO = zap(`Olá! Vim pelo site e quero ver uma demonstração do ${cfg.nomeSistema}.`);
  const AVISTA = reais(cfg.precoAVista);
  const PARCELADO = `${cfg.parcelas}x de ${reais(cfg.valorParcela)}`;
  const PRECO = `${AVISTA} à vista ou ${PARCELADO}`;
  const MENSAL = reais(cfg.valorParcela);
  const FAQ = faq(PRECO, MENSAL);
  const [marca, ...resto] = cfg.nomeSistema.split(' ');
  const marcaCompleta = resto.length > 1 ? `${marca} ${resto[0]}` : marca;
  const sufixo = resto.length > 1 ? resto.slice(1).join(' ') : resto.join(' ');

  return (
    <div className={`lp lp-grain min-h-screen overflow-x-hidden ${serif.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: cssTema(cfg) }} />
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <nav className="mt-4 flex h-14 items-center justify-between rounded-2xl border border-white/[0.08] bg-[#05060a]/70 px-4 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[rgb(var(--brand-500))] to-[rgb(var(--accent-500))] shadow-[0_0_24px_rgb(var(--brand-500)/0.6)]">
                <Calculator size={16} className="text-white" />
              </span>
              <span className="font-semibold tracking-tight">
                {marcaCompleta} <span className="hidden text-[#8b90a6] sm:inline">{sufixo}</span>
              </span>
            </Link>
            <div className="hidden items-center gap-7 text-sm text-[#8b90a6] md:flex">
              <a href="#recursos" className="transition-colors hover:text-white">Recursos</a>
              <a href="#como-funciona" className="transition-colors hover:text-white">Como funciona</a>
              <a href="#planos" className="transition-colors hover:text-white">Preço</a>
              <a href="#seguranca" className="transition-colors hover:text-white">Segurança</a>
              <a href="#faq" className="transition-colors hover:text-white">Dúvidas</a>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden px-3 py-2 text-sm text-[#8b90a6] hover:text-white sm:block">
                Entrar
              </Link>
              <a
                href={ZAP_COMPRAR}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-xl bg-[rgb(var(--signal))] px-4 py-2 text-sm font-semibold text-[rgb(var(--signal-ink))] transition hover:shadow-[0_0_30px_rgb(var(--signal)/0.5)]"
              >
                Quero o sistema
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pb-24 pt-36 sm:pt-44">
        <div className="lp-grid absolute inset-0" />
        <div className="absolute left-1/2 top-[-280px] h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--brand-500)/0.28),transparent)] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="lp-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8b90a6] sm:text-[11px] sm:tracking-[0.2em]">
              <span className="lp-pulse h-1.5 w-1.5 rounded-full bg-[rgb(var(--signal))]" />
              Contabilidade com inteligência artificial
            </p>
            <h1
              className="lp-rise mt-7 font-[family-name:var(--font-serif)] text-[clamp(3rem,7.5vw,6.5rem)] leading-[0.92] tracking-[-0.02em]"
              style={{ animationDelay: '120ms' }}
            >
              Nenhuma obrigação
              <br />
              <em className="bg-gradient-to-r from-white via-[rgb(var(--brand-300))] to-[rgb(var(--brand-500))] bg-clip-text text-transparent">esquecida.</em>
              <span className="block text-white/35">Nenhum cliente multado.</span>
            </h1>
            <p className="lp-rise mt-7 max-w-xl text-lg leading-relaxed text-[#8b90a6]" style={{ animationDelay: '240ms' }}>
              O {cfg.nomeSistema} monta a agenda de obrigações de cada cliente, ajusta os prazos aos feriados, organiza a semana da
              equipe e redige seus documentos. Você cuida dos clientes; o sistema cuida dos prazos.
            </p>
            <div className="lp-rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: '360ms' }}>
              <a
                href={ZAP_COMPRAR}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--signal))] px-7 py-4 text-base font-semibold text-[rgb(var(--signal-ink))] transition hover:shadow-[0_0_50px_rgb(var(--signal)/0.45)]"
              >
                Contratar pelo WhatsApp
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href={ZAP_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 py-4 text-base text-white/80 transition hover:border-white/25 hover:bg-white/[0.04]"
              >
                Ver demonstração
              </a>
            </div>
            <ul className="lp-rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#8b90a6]" style={{ animationDelay: '480ms' }}>
              {[`${AVISTA} ou ${PARCELADO}`, '12 meses de suporte', 'Funciona no celular'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check size={15} className="text-[rgb(var(--signal))]" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-rise" style={{ animationDelay: '300ms' }}>
            <FluxoAoVivo />
          </div>
        </div>
      </section>

      {/* FONTES */}
      <section className="border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-8 sm:px-8 md:flex-row md:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">Dados oficiais e integrações</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-medium text-white/55">
            <span>Receita Federal · CNPJ</span>
            <span>Banco Central · SGS</span>
            <span>SERPRO Integra Contador</span>
            <span>eSocial</span>
            <span>SEFAZ</span>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="relative py-28">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--signal))]">O problema</p>
            <h2 className="mt-5 font-[family-name:var(--font-serif)] text-[clamp(2.2rem,5vw,4rem)] leading-[1.02]">
              Uma guia atrasada custa multa ao cliente.
              <br />
              <em className="text-white/40">E a confiança no escritório.</em>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#8b90a6]">
              Planilhas de prazos, calendário na parede, cadastro digitado à mão e documentos refeitos do zero. O {cfg.nomeSistema} junta
              tudo num painel e trabalha para que nada passe do prazo.
            </p>
          </Reveal>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="relative scroll-mt-24 pb-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-xl font-[family-name:var(--font-serif)] text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.02]">
              O escritório inteiro,
              <em className="text-[rgb(var(--brand-300))]"> num só painel.</em>
            </h2>
            <p className="max-w-sm text-[#8b90a6]">
              40 módulos entre fiscal, Receita Federal, trabalhista, contábil e financeiro, organizados por área e entregues em
              etapas.
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RECURSOS.map((r, i) => (
              <Reveal key={r.titulo} delay={(i % 4) * 80} className={r.grande ? 'sm:col-span-2' : ''}>
                <div
                  className={`group relative h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-7 transition duration-500 hover:border-[rgb(var(--brand-500)/0.5)] ${
                    r.grande ? 'min-h-[240px]' : 'min-h-[220px]'
                  }`}
                >
                  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[rgb(var(--brand-500)/0.0)] blur-3xl transition duration-700 group-hover:bg-[rgb(var(--brand-500)/0.25)]" />
                  <div className="relative flex h-full flex-col">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[rgb(var(--brand-300))] transition group-hover:bg-[rgb(var(--brand-500))] group-hover:text-white">
                      <r.icon size={20} />
                    </span>
                    <h3 className={`mt-auto pt-10 font-medium tracking-tight ${r.grande ? 'text-2xl' : 'text-lg'}`}>{r.titulo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#8b90a6]">{r.texto}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="relative scroll-mt-24 overflow-hidden border-y border-white/[0.06] py-28">
        <div className="lp-orbit absolute -right-[300px] top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full border border-dashed border-white/[0.07]" />
        <div
          className="lp-orbit absolute -right-[180px] top-1/2 h-[460px] w-[460px] -translate-y-1/2 rounded-full border border-white/[0.05]"
          style={{ animationDirection: 'reverse' }}
        />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--signal))]">Como funciona</p>
            <h2 className="mt-5 max-w-2xl font-[family-name:var(--font-serif)] text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.02]">
              Três passos e o mês
              <em className="text-white/40"> se organiza sozinho.</em>
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {PASSOS.map((p, i) => (
              <Reveal key={p.n} delay={i * 120}>
                <div className="relative h-full rounded-3xl border border-white/[0.08] bg-[#07080d] p-8">
                  <span className="font-[family-name:var(--font-serif)] text-7xl leading-none text-transparent [-webkit-text-stroke:1px_rgb(var(--brand-300)/0.5)]">
                    {p.n}
                  </span>
                  <h3 className="mt-8 text-xl font-medium">{p.titulo}</h3>
                  <p className="mt-2 text-[#8b90a6]">{p.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DESTAQUE */}
      <section className="py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-3xl border border-white/[0.08] bg-[#0b0d14] p-3 shadow-[0_30px_100px_-30px_rgb(var(--brand-500)/0.5)]">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                <Search size={17} className="text-white/40" />
                <span className="text-white/80">padaria sol nascente</span>
              </div>
              <div className="mt-2 space-y-1">
                {[
                  { icon: Receipt, t: 'PGDAS-D e DAS · competência 09/2026', d: 'Simples Nacional · vence 20/10' },
                  { icon: FilePenLine, t: 'Contrato de serviços contábeis.doc', d: 'Gerado com IA' },
                  { icon: Users, t: '6 funcionários ativos', d: 'eSocial e FGTS na agenda do mês' },
                ].map((x, i) => (
                  <div key={x.t} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${i === 0 ? 'bg-[rgb(var(--brand-500)/0.15)]' : ''}`}>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${i === 0 ? 'bg-[rgb(var(--brand-500))] text-white' : 'bg-white/5 text-white/50'}`}>
                      <x.icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{x.t}</p>
                      <p className="truncate text-xs text-white/45">{x.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-white/30">Ilustração com dados fictícios.</p>
          </Reveal>
          <Reveal delay={120}>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--signal))]">Produtividade</p>
            <h2 className="mt-5 font-[family-name:var(--font-serif)] text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.02]">
              Do CNPJ ao documento
              <em className="text-[rgb(var(--brand-300))]"> em minutos.</em>
            </h2>
            <p className="mt-6 text-lg text-[#8b90a6]">
              Cadastre o cliente pelo CNPJ, veja as obrigações dele no calendário e gere o contrato, a declaração ou a procuração
              com a IA, já com os dados preenchidos.
            </p>
            <ul className="mt-8 space-y-3">
              {['200 modelos em 11 categorias', 'Exportação para Word (.doc)', 'Calendário com feriados nacionais'].map((t) => (
                <li key={t} className="flex items-start gap-3 text-white/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--signal)/0.15)]">
                    <Check size={12} className="text-[rgb(var(--signal))]" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* SEGURANÇA */}
      <section id="seguranca" className="scroll-mt-24 pb-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-gradient-to-br from-[#0d0e1a] to-[#05060a] p-8 sm:p-14">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_80%_20%,rgb(var(--brand-500)/0.25),transparent_60%)]" />
              <div className="relative grid gap-12 lg:grid-cols-[1fr_1.2fr]">
                <div>
                  <ShieldCheck size={32} className="text-[rgb(var(--signal))]" />
                  <h2 className="mt-6 font-[family-name:var(--font-serif)] text-[clamp(2rem,4vw,3.2rem)] leading-[1.05]">
                    Sigilo fiscal
                    <em className="text-white/40"> levado a sério.</em>
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {[
                    { t: 'Dados isolados', d: 'Cada escritório só acessa os próprios clientes, notas e documentos.' },
                    { t: 'Certificados criptografados', d: 'Arquivo .pfx e senha guardados com AES-256, nunca expostos na tela.' },
                    { t: 'Chaves protegidas', d: 'Credenciais do SERPRO e de gateways cifradas e mascaradas.' },
                    { t: 'Senhas seguras', d: 'Senhas de acesso guardadas com hash bcrypt.' },
                  ].map((x) => (
                    <div key={x.t} className="border-l border-white/10 pl-5">
                      <p className="font-medium">{x.t}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#8b90a6]">{x.d}</p>
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
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--signal))]">Preço</p>
            <h2 className="mt-5 font-[family-name:var(--font-serif)] text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.02]">
              Um investimento,
              <em className="text-white/40"> um ano inteiro de tranquilidade.</em>
            </h2>
          </Reveal>
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal>
              <div className="flex h-full flex-col rounded-3xl border border-white/[0.08] bg-[#07080d] p-8">
                <p className="text-sm font-medium text-white/70">Demonstração</p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="font-[family-name:var(--font-serif)] text-6xl">R$ 0</span>
                  <span className="text-[#8b90a6]">ao vivo</span>
                </p>
                <p className="mt-3 text-sm text-[#8b90a6]">Veja o sistema funcionando com um especialista antes de decidir.</p>
                <ul className="mt-8 space-y-3 text-sm text-white/80">
                  {['Apresentação pelo WhatsApp ou vídeo', 'Tire as dúvidas do seu escritório', 'Sem compromisso'].map((t) => (
                    <li key={t} className="flex items-center gap-3">
                      <Check size={16} className="text-white/50" /> {t}
                    </li>
                  ))}
                </ul>
                <a href={ZAP_DEMO} target="_blank" rel="noopener noreferrer" className="mt-auto pt-10">
                  <span className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-6 py-3.5 font-medium text-white transition hover:border-white/30 hover:bg-white/[0.04]">
                    Agendar demonstração <ArrowRight size={16} />
                  </span>
                </a>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="relative h-full overflow-hidden rounded-3xl border border-[rgb(var(--brand-500)/0.5)] bg-gradient-to-b from-[rgb(var(--brand-950))] to-[#07080d] p-8 shadow-[0_40px_120px_-30px_rgb(var(--brand-500)/0.6)]">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[rgb(var(--brand-500)/0.3)] blur-3xl" />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[rgb(var(--brand-300))]">Plano Pro</p>
                    <span className="rounded-full bg-[rgb(var(--signal))] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--signal-ink))]">Completo</span>
                  </div>
                  <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-[family-name:var(--font-serif)] text-6xl sm:text-7xl">{AVISTA}</span>
                    <span className="text-[#8b90a6]">à vista</span>
                  </p>
                  <p className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-[rgb(var(--signal)/0.3)] bg-[rgb(var(--signal)/0.1)] px-3 py-1 text-sm text-white">
                    ou <b className="text-[rgb(var(--signal))]">{PARCELADO}</b>
                  </p>
                  <p className="mt-3 text-sm text-white/70">
                    À vista, equivale a <b className="text-white">{reais(Math.round(cfg.precoAVista / 12))} por mês</b> no primeiro ano, com <b className="text-white">12 meses de suporte total</b> incluídos.
                  </p>
                  <ul className="mt-8 grid gap-3 text-sm text-white/85 sm:grid-cols-2">
                    {[
                      'Agenda de obrigações automática',
                      '200 modelos de documentos com IA',
                      'Clientes importados pelo CNPJ',
                      'Cofre de certificados A1',
                      'Notas, financeiro e documentos',
                      'Integrações com os órgãos',
                      'Instalação e treinamento',
                      'Suporte total por 12 meses',
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--signal)/0.15)]">
                          <Check size={12} className="text-[rgb(var(--signal))]" strokeWidth={3} />
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/70">
                    Após o primeiro ano: <b className="text-white">{MENSAL}/mês</b>, conforme contrato.
                  </div>
                  <a
                    href={ZAP_COMPRAR}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--signal))] px-6 py-4 font-semibold text-[rgb(var(--signal-ink))] transition hover:shadow-[0_0_50px_rgb(var(--signal)/0.45)]"
                  >
                    Contratar o Plano Pro
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                  </a>
                  <p className="mt-3 text-center text-xs text-[#8b90a6]">Atendimento pelo WhatsApp {WHATSAPP_EXIBICAO}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 pb-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <h2 className="font-[family-name:var(--font-serif)] text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.02]">
              Perguntas
              <em className="text-white/40"> frequentes.</em>
            </h2>
            <p className="mt-4 text-[#8b90a6]">Não encontrou o que procurava? Chame a gente no WhatsApp {WHATSAPP_EXIBICAO}.</p>
          </Reveal>
          <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {FAQ.map((f) => (
              <details key={f.p} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {f.p}
                  <Plus size={20} className="shrink-0 text-white/40 transition-transform duration-300 group-open:rotate-45 group-open:text-[rgb(var(--signal))]" />
                </summary>
                <p className="mt-4 max-w-2xl leading-relaxed text-[#8b90a6]">{f.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-[rgb(var(--signal))] px-8 py-20 text-center text-[rgb(var(--signal-ink))] sm:py-28">
            <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgb(var(--signal-ink))_1px,transparent_1px),linear-gradient(90deg,rgb(var(--signal-ink))_1px,transparent_1px)] [background-size:40px_40px]" />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl font-[family-name:var(--font-serif)] text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.95]">
                O próximo vencimento já está
                <em> chegando.</em>
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-lg text-[rgb(var(--signal-ink)/0.65)]">Configure hoje e gere amanhã a agenda do mês de toda a carteira.</p>
              <a
                href={ZAP_COMPRAR}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-10 inline-flex items-center gap-2 rounded-2xl bg-[rgb(var(--signal-ink))] px-8 py-4 text-base font-semibold text-[rgb(var(--signal))] transition hover:scale-[1.02]"
              >
                Falar no WhatsApp
                <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <p className="mt-4 text-sm text-[rgb(var(--signal-ink)/0.55)]">{PRECO} · {WHATSAPP_EXIBICAO}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* WhatsApp flutuante */}
      <a
        href={ZAP_COMPRAR}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25d366] p-3.5 text-black shadow-[0_10px_40px_-5px_rgba(37,211,102,0.6)] transition-all hover:pr-5"
      >
        <MessageCircle size={24} strokeWidth={2.2} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[180px]">
          Falar com especialista
        </span>
      </a>

      {/* RODAPÉ */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-white/40 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <Calculator size={15} /> {cfg.nomeSistema}
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-white">
              Entrar
            </Link>
            <a href={ZAP_COMPRAR} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              WhatsApp {WHATSAPP_EXIBICAO}
            </a>
          </div>
          <p>© {new Date().getFullYear()} {cfg.nomeSistema}</p>
        </div>
      </footer>
    </div>
  );
}
