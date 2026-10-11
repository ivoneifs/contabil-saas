import Link from 'next/link';

const WHATSAPP = '5574988258825';
const WHATSAPP_DISPLAY = '(74) 98825-8825';

function whatsappLink(mensagem: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}

const MSG_COMPRAR = 'Olá! Quero adquirir o Genesisia Contabilidade (Plano Pro).';
const MSG_DEMO = 'Olá! Quero ver uma demonstração do Genesisia Contabilidade.';

const recursos = [
  {
    icone: '◈',
    titulo: 'Clientes em segundos',
    texto: 'Digite o CNPJ e o cadastro se preenche sozinho: razão social, endereço, atividade e situação cadastral.',
  },
  {
    icone: '⬡',
    titulo: 'Fiscal integrado',
    texto: 'Emissão de NF-e e NFC-e via gateway, com foco em SEFAZ-BA. Tudo vinculado ao cliente certo.',
  },
  {
    icone: '◎',
    titulo: 'Kanban de obrigações',
    texto: 'Cada obrigação fiscal num quadro visual: a fazer, em andamento, entregue. Nada passa do prazo.',
  },
  {
    icone: '✦',
    titulo: 'Assistente de IA',
    texto: 'Tire dúvidas, redija respostas e organize o dia com uma IA dentro do painel.',
  },
  {
    icone: '▣',
    titulo: 'Documentos organizados',
    texto: 'Upload e download por cliente, com categorias completas de documentos contábeis.',
  },
  {
    icone: '◇',
    titulo: 'Agenda e financeiro',
    texto: 'Compromissos do escritório, financeiro e departamento pessoal de cada cliente num só lugar.',
  },
];

const dores = [
  'Planilhas espalhadas e informação perdida',
  'Prazos de obrigações lembrados na última hora',
  'Cadastro de cliente digitado à mão, campo por campo',
  'Documentos de clientes perdidos no WhatsApp e no e-mail',
];

const incluso = [
  'Sistema completo, sem limite de clientes',
  'Instalação e configuração para o seu escritório',
  'Treinamento da equipe',
  '12 meses de suporte total',
  'Atualizações durante o suporte',
  'Assistente de IA no painel',
];

const perguntas = [
  {
    p: 'Preciso instalar alguma coisa?',
    r: 'Não. O sistema roda no navegador, no computador ou no celular. Nós cuidamos da instalação e da configuração.',
  },
  {
    p: 'Como funciona o pagamento?',
    r: 'R$ 4.000 à vista ou 10x de R$ 500. O valor inclui 12 meses de suporte total. Fale com a gente pelo WhatsApp para fechar.',
  },
  {
    p: 'Atende mais de um escritório ou equipe?',
    r: 'Sim. O sistema é multiempresa: cada escritório tem seus próprios clientes, usuários e dados separados.',
  },
  {
    p: 'Posso ver funcionando antes de comprar?',
    r: 'Pode. Chame no WhatsApp e agendamos uma demonstração ao vivo.',
  },
];

function BotaoWhatsApp({ texto, mensagem, grande }: { texto: string; mensagem: string; grande?: boolean }) {
  return (
    <a
      href={whatsappLink(mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      className={`lp-cta inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[#03121a] ${
        grande ? 'px-8 py-4 text-lg' : 'px-6 py-3'
      }`}
    >
      <IconeWhatsApp />
      {texto}
    </a>
  );
}

function IconeWhatsApp({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="lp min-h-screen overflow-x-hidden">
      <div className="lp-grid" aria-hidden="true" />
      <div className="lp-orb lp-orb-a" aria-hidden="true" />
      <div className="lp-orb lp-orb-b" aria-hidden="true" />

      {/* Topo */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="text-lg font-bold tracking-tight">
          <span className="lp-gradient-text">Genesisia</span> Contabilidade
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <a href="#preco" className="hidden text-slate-300 hover:text-white sm:inline">
            Preço
          </a>
          <Link href="/login" className="rounded-full border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/5">
            Entrar
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-12 text-center sm:pt-20">
        <p className="lp-chip mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-cyan-200">
          <span className="lp-pulse h-2 w-2 rounded-full bg-cyan-300" /> Escritório contábil com IA
        </p>
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-6xl">
          O escritório contábil do <span className="lp-gradient-text">futuro</span>, rodando hoje no seu navegador
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 text-balance">
          Clientes, obrigações fiscais, notas, documentos, agenda e IA num só painel. Menos planilha, menos prazo
          perdido, mais tempo para atender.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <BotaoWhatsApp texto="Quero o sistema" mensagem={MSG_COMPRAR} grande />
          <a
            href={whatsappLink(MSG_DEMO)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-cyan-300/30 px-8 py-4 text-lg text-cyan-100 hover:bg-cyan-300/10"
          >
            Ver demonstração
          </a>
        </div>
        <p className="mt-5 text-sm text-slate-400">
          R$ 4.000 à vista ou <strong className="text-white">10x de R$ 500</strong> · 12 meses de suporte incluídos
        </p>

        {/* Painel ilustrativo */}
        <div className="lp-panel relative mx-auto mt-16 max-w-4xl rounded-2xl p-1 text-left">
          <div className="rounded-xl bg-[#060b18]/90 p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-300/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 font-mono text-xs text-slate-500">painel / obrigações</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { t: 'A fazer', c: 'text-amber-300', itens: ['DAS · Padaria Sol', 'DCTFWeb · Construtora BA'] },
                { t: 'Em andamento', c: 'text-cyan-300', itens: ['EFD-Reinf · Clínica Vida', 'FGTS · Mercado Feira'] },
                { t: 'Entregue', c: 'text-emerald-300', itens: ['DEFIS · Auto Peças', 'GPS · Farmácia Central'] },
              ].map((col) => (
                <div key={col.t} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                  <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${col.c}`}>{col.t}</p>
                  {col.itens.map((i) => (
                    <div key={i} className="mb-2 rounded-md border border-white/5 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                      {i}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-violet-400/20 bg-violet-500/10 p-3 text-sm">
              <span className="text-violet-300">✦ IA</span>
              <span className="text-slate-300">2 obrigações vencem esta semana. Quer que eu monte a agenda da equipe?</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">Imagem ilustrativa com dados fictícios.</p>
      </section>

      {/* Dores */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Seu escritório ainda vive assim?</h2>
            <ul className="mt-6 space-y-3">
              {dores.map((d) => (
                <li key={d} className="flex items-start gap-3 text-slate-300">
                  <span className="mt-0.5 text-rose-400">✕</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-card rounded-2xl p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Com a Genesisia</p>
            <p className="mt-3 text-2xl font-semibold leading-snug">
              Tudo do cliente num lugar só, com prazos à vista e uma IA ajudando a equipe todo dia.
            </p>
            <div className="mt-6">
              <BotaoWhatsApp texto="Falar no WhatsApp" mensagem={MSG_DEMO} />
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Tudo o que o escritório precisa, <span className="lp-gradient-text">num só sistema</span>
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recursos.map((r) => (
            <div key={r.titulo} className="lp-card rounded-2xl p-6 transition hover:-translate-y-1">
              <span className="lp-gradient-text text-3xl">{r.icone}</span>
              <h3 className="mt-4 text-lg font-semibold">{r.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{r.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preço */}
      <section id="preco" className="relative z-10 mx-auto max-w-6xl scroll-mt-8 px-4 py-20">
        <div className="lp-panel mx-auto max-w-xl rounded-3xl p-1">
          <div className="rounded-[1.4rem] bg-[#060b18]/95 p-8 text-center sm:p-10">
            <p className="lp-chip mx-auto inline-block rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
              Plano Pro
            </p>
            <p className="mt-6 text-slate-400">10x de</p>
            <p className="text-6xl font-extrabold tracking-tight">
              <span className="lp-gradient-text">R$ 500</span>
            </p>
            <p className="mt-2 text-slate-300">
              ou <strong className="text-white">R$ 4.000 à vista</strong>
            </p>
            <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left">
              {incluso.map((i) => (
                <li key={i} className="flex items-start gap-3 text-slate-200">
                  <span className="mt-0.5 text-cyan-300">✓</span>
                  {i}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <BotaoWhatsApp texto="Garantir meu sistema" mensagem={MSG_COMPRAR} grande />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Após 12 meses, suporte opcional de R$ 500/mês conforme contrato.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Perguntas frequentes</h2>
        <div className="mt-10 space-y-3">
          {perguntas.map((f) => (
            <details key={f.p} className="lp-card group rounded-xl p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {f.p}
                <span className="text-cyan-300 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-8 text-center">
        <h2 className="mx-auto max-w-3xl text-3xl font-bold text-balance sm:text-5xl">
          Leve seu escritório para o <span className="lp-gradient-text">próximo nível</span>
        </h2>
        <p className="mt-4 text-slate-400">Fale agora com a gente: {WHATSAPP_DISPLAY}</p>
        <div className="mt-8">
          <BotaoWhatsApp texto="Chamar no WhatsApp" mensagem={MSG_COMPRAR} grande />
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Genesisia Contabilidade · WhatsApp {WHATSAPP_DISPLAY}
      </footer>

      {/* Botão flutuante */}
      <a
        href={whatsappLink(MSG_COMPRAR)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/40 transition hover:scale-110"
      >
        <IconeWhatsApp className="h-7 w-7" />
      </a>
    </div>
  );
}
