'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calculator, ChevronDown, Crown, LogOut, Menu, Search, Settings, X } from 'lucide-react';
import { apiFetch, clearToken, getIsSuperAdmin } from '@/lib/api';
import { EuContexto, type Eu } from '@/lib/permissoes';
import { GRUPOS, TODOS_MODULOS, hrefDo } from '@/lib/modulos';
import { usePlataforma } from '@/lib/usar-plataforma';

const FUNDO = 'bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950';

function ativo(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Lê o e-mail e o papel do JWT guardado no login (só para exibição).
function usuarioDoToken(): { email: string; role: string; organizationId: string } {
  try {
    const token = window.localStorage.getItem('accessToken') ?? '';
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { email: payload.email ?? '', role: payload.role ?? '', organizationId: payload.organizationId ?? '' };
  } catch {
    return { email: '', role: '', organizationId: '' };
  }
}

const PAPEL: Record<string, string> = { ADMIN: 'Administrador', CONTADOR: 'Contador', ASSISTENTE: 'Assistente' };

function Logo({ nome }: { nome: string }) {
  const [marca, ...resto] = nome.split(' ');
  const titulo = resto.length > 1 ? `${marca} ${resto[0]}` : marca;
  const sub = resto.length > 1 ? resto.slice(1).join(' ') : resto.join(' ');
  return (
    <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
        <Calculator size={16} />
      </div>
      <div className="leading-tight">
        <span className="block font-semibold tracking-tight text-white">{titulo}</span>
        {sub && <span className="block text-[11px] text-white/45">{sub}</span>}
      </div>
    </div>
  );
}

function Navegacao({ superAdmin, permissoes, onNavegar }: { superAdmin: boolean; permissoes: string[] | null; onNavegar?: () => void }) {
  const pathname = usePathname();
  const [busca, setBusca] = useState('');
  const termo = busca.trim().toLowerCase();
  const grupos = GRUPOS.map((g) => ({
    ...g,
    modulos: g.modulos
      .filter((m) => superAdmin || !m.perm || permissoes?.includes(m.perm))
      .filter((m) => !termo || m.titulo.toLowerCase().includes(termo)),
  })).filter((g) => g.modulos.length);

  return (
    <>
      <div className="px-3 pt-4">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10 focus-within:ring-indigo-400/60">
          <Search size={15} className="text-white/40" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={`Buscar em ${TODOS_MODULOS.length} módulos`}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {grupos.map((g) => (
          <div key={g.grupo}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/35">{g.grupo}</p>
            <div className="space-y-0.5">
              {g.modulos.map((m) => {
                const href = hrefDo(m);
                const on = ativo(pathname, href);
                const Icone = m.icone;
                const ia = m.slug === 'assistente' || m.slug === 'modelos' || m.slug === 'calendario';
                return (
                  <Link
                    key={m.slug}
                    href={href}
                    onClick={onNavegar}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      on
                        ? 'bg-gradient-to-r from-indigo-500/25 to-violet-500/10 text-white ring-1 ring-inset ring-white/10'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icone size={17} className="shrink-0" />
                    <span className="flex-1 truncate">{m.titulo}</span>
                    {ia && <span className="rounded bg-violet-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">IA</span>}
                    {!m.href && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-white/35">E{m.etapa}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {superAdmin && !termo && (
          <div>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/35">Plataforma</p>
            <Link
              href="/dashboard/admin"
              onClick={onNavegar}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                ativo(pathname, '/dashboard/admin')
                  ? 'bg-gradient-to-r from-indigo-500/25 to-violet-500/10 text-white ring-1 ring-inset ring-white/10'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Crown size={17} /> Super Admin
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [gaveta, setGaveta] = useState(false);
  const [menu, setMenu] = useState(false);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [usuario, setUsuario] = useState({ email: '', role: '', organizationId: '' });
  const [suporte, setSuporte] = useState<string | null>(null);
  const [eu, setEu] = useState<Eu | null>(null);
  const [semEscritorio, setSemEscritorio] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const plataforma = usePlataforma();

  useEffect(() => {
    if (!window.localStorage.getItem('accessToken')) {
      router.replace('/login');
      return;
    }
    setSuperAdmin(getIsSuperAdmin());
    const u = usuarioDoToken();
    setUsuario(u);
    setSemEscritorio(!u.organizationId);
    setSuporte(window.localStorage.getItem('tokenSuperAdmin') ? window.localStorage.getItem('suporteEscritorio') : null);
    setPronto(true);
    apiFetch<Eu>('/auth/eu')
      .then(setEu)
      .catch((err) => {
        // Sessão inválida (usuário removido/bloqueado): volta ao login.
        if (err instanceof Error && /401|bloquead|removid|não faz mais parte/i.test(err.message)) {
          clearToken();
          router.replace('/login');
        }
      });
  }, [router]);

  useEffect(() => {
    setGaveta(false);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = gaveta ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [gaveta]);

  useEffect(() => {
    if (!menu) return;
    const fechar = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, [menu]);

  function sair() {
    clearToken();
    window.localStorage.removeItem('tokenSuperAdmin');
    window.localStorage.removeItem('suporteEscritorio');
    router.push('/login');
  }

  function voltarAoSuperAdmin() {
    const token = window.localStorage.getItem('tokenSuperAdmin');
    window.localStorage.removeItem('tokenSuperAdmin');
    window.localStorage.removeItem('suporteEscritorio');
    if (token) window.localStorage.setItem('accessToken', token);
    window.location.href = '/dashboard/admin';
  }

  // Super Admin sem escritório próprio só tem a área da plataforma.
  useEffect(() => {
    if (pronto && semEscritorio && superAdmin && !pathname.startsWith('/dashboard/admin')) {
      router.replace('/dashboard/admin');
    }
  }, [pronto, semEscritorio, superAdmin, pathname, router]);

  if (!pronto) return <div className="min-h-screen bg-slate-50" />;

  const atual = TODOS_MODULOS.find((m) => ativo(pathname, hrefDo(m)));
  const inicial = ((eu?.nome || usuario.email)[0] ?? 'G').toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <aside className={`sticky top-0 hidden h-screen w-64 shrink-0 flex-col md:flex print:!hidden ${FUNDO}`}>
        <Logo nome={plataforma.nomeSistema} />
        <Navegacao superAdmin={superAdmin} permissoes={eu?.permissoes ?? null} />
      </aside>

      {gaveta && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setGaveta(false)} />
          <aside className={`relative flex h-full w-72 max-w-[85vw] flex-col shadow-2xl ${FUNDO}`}>
            <button
              type="button"
              onClick={() => setGaveta(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
            >
              <X size={18} />
            </button>
            <Logo nome={plataforma.nomeSistema} />
            <Navegacao superAdmin={superAdmin} permissoes={eu?.permissoes ?? null} onNavegar={() => setGaveta(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {suporte && (
          <div className="flex flex-wrap items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm text-white print:hidden">
            <span>
              Modo suporte: você está no painel de <b>{suporte}</b>.
            </span>
            <button onClick={voltarAoSuperAdmin} className="rounded-md bg-white/15 px-3 py-1 font-medium hover:bg-white/25">
              Voltar ao Super Admin
            </button>
          </div>
        )}
        <header className="sticky top-0 z-30 flex h-16 print:hidden items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setGaveta(true)}
              aria-label="Abrir menu"
              className="-ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{atual?.titulo ?? plataforma.nomeSistema}</p>
              {atual && <p className="hidden truncate text-xs text-slate-500 sm:block">{atual.resumo}</p>}
            </div>
          </div>

          <div className="relative" ref={ref}>
            <button type="button" onClick={() => setMenu((v) => !v)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
                {inicial}
              </div>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-[180px] truncate text-sm font-medium text-slate-800">{eu?.nome || usuario.email}</span>
                <span className="block text-[11px] text-slate-500">{superAdmin ? 'Super Admin' : PAPEL[eu?.papel ?? usuario.role] ?? usuario.role}</span>
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {menu && (
              <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200">
                <Link href="/dashboard/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  <Settings size={15} /> Configurações
                </Link>
                <button type="button" onClick={sair} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut size={15} /> Sair
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 px-4 py-6 lg:px-8 print:p-0">
          <EuContexto.Provider value={eu}>{children}</EuContexto.Provider>
        </div>
      </div>
    </div>
  );
}
