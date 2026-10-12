'use client';

import { useState } from 'react';
import { Building2, KeyRound, Palette, ShieldCheck } from 'lucide-react';
import { Indicador, Titulo, useApi } from '@/components/ui';
import Escritorios from './escritorios';
import ChavesIa from './chaves-ia';
import Aparencia from './aparencia';

interface Resumo {
  escritorios: number;
  ativos: number;
  bloqueados: number;
  vencendo: number;
  usuarios: number;
  clientes: number;
}

const ABAS = [
  { id: 'escritorios', titulo: 'Escritórios e usuários', icone: Building2 },
  { id: 'ia', titulo: 'Chaves de IA', icone: KeyRound },
  { id: 'aparencia', titulo: 'Aparência', icone: Palette },
] as const;

export default function SuperAdminPage() {
  const [aba, setAba] = useState<(typeof ABAS)[number]['id']>('escritorios');
  const { dados: r, recarregar } = useApi<Resumo>('/admin/resumo');

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="Super Admin"
        subtitulo="Controle total da plataforma: escritórios vendidos, usuários, licenças, IA e aparência."
        acoes={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            <ShieldCheck size={14} /> Acesso total
          </span>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Indicador rotulo="Escritórios" valor={r?.escritorios ?? '–'} detalhe={`${r?.usuarios ?? 0} usuários`} />
        <Indicador rotulo="Ativos" valor={r?.ativos ?? '–'} tom="green" />
        <Indicador rotulo="Vencem em 30 dias" valor={r?.vencendo ?? '–'} tom="amber" />
        <Indicador rotulo="Bloqueados ou vencidos" valor={r?.bloqueados ?? '–'} tom="red" />
        <Indicador rotulo="Clientes na plataforma" valor={r?.clientes ?? '–'} tom="indigo" />
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {ABAS.map(({ id, titulo, icone: Icone }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              aba === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icone size={16} /> {titulo}
          </button>
        ))}
      </div>

      {aba === 'escritorios' && <Escritorios onMudou={recarregar} />}
      {aba === 'ia' && <ChavesIa />}
      {aba === 'aparencia' && <Aparencia />}
    </main>
  );
}
