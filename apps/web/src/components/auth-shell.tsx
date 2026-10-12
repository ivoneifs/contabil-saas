'use client';

import { Calculator, CalendarClock, FilePenLine, Landmark, ShieldCheck } from 'lucide-react';
import { usePlataforma } from '@/lib/usar-plataforma';

// Moldura das telas de login e cadastro.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  const { nomeSistema } = usePlataforma();
  return (
    <div className="grid min-h-screen w-full bg-white text-slate-900 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-12 text-white lg:flex">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/40">
            <Calculator size={20} />
          </div>
          <span className="text-xl font-semibold tracking-tight">{nomeSistema}</span>
        </div>

        <div className="relative space-y-6">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">O escritório contábil inteiro, num só painel inteligente.</h1>
          <p className="max-w-md text-white/70">
            Clientes, obrigações, notas, folha, Receita Federal e documentos, com inteligência artificial para cuidar dos prazos
            e redigir por você.
          </p>
          <ul className="grid max-w-md grid-cols-2 gap-3 pt-2">
            {[
              { icon: CalendarClock, t: 'Agenda de obrigações automática' },
              { icon: FilePenLine, t: '200 modelos de documentos com IA' },
              { icon: Landmark, t: 'Pronto para Receita, eSocial e SEFAZ' },
              { icon: ShieldCheck, t: 'Certificados A1 criptografados' },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="rounded-xl bg-white/5 p-3 text-sm text-white/85 ring-1 ring-inset ring-white/10 backdrop-blur">
                <Icon size={17} className="mb-2 text-violet-300" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/40">© {new Date().getFullYear()} {nomeSistema}</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <Calculator size={18} />
            </div>
            <span className="text-lg font-semibold">{nomeSistema}</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
