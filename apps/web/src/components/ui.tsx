'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export function Titulo({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: string; acoes?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function Indicador({ rotulo, valor, detalhe, tom = 'slate' }: { rotulo: string; valor: React.ReactNode; detalhe?: string; tom?: 'slate' | 'red' | 'amber' | 'green' | 'indigo' }) {
  const cor = { slate: 'text-slate-900', red: 'text-rose-600', amber: 'text-amber-600', green: 'text-emerald-600', indigo: 'text-indigo-700' }[tom];
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{rotulo}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${cor}`}>{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-slate-500">{detalhe}</p>}
    </Card>
  );
}

export function Selo({ children, tom = 'slate' }: { children: React.ReactNode; tom?: 'slate' | 'green' | 'amber' | 'red' | 'indigo' | 'violet' }) {
  const cls = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-rose-50 text-rose-700 ring-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  }[tom];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-transparent ${cls}`}>{children}</span>;
}

export function Botao({ children, variante = 'primario', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'secundario' | 'perigo' }) {
  const cls = {
    primario: 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700',
    secundario: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    perigo: 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50',
  }[variante];
  return (
    <button {...props} className={`rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${cls} ${props.className ?? ''}`}>
      {children}
    </button>
  );
}

export const campo = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';

export function Erro({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{msg}</p>;
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{children}</p>;
}

export function Tabela({ cabecalho, children }: { cabecalho: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {cabecalho.map((c) => (
              <th key={c} className="whitespace-nowrap px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function useApi<T>(path: string | null) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(!!path);

  const recarregar = useCallback(async () => {
    if (!path) return;
    setCarregando(true);
    setErro(null);
    try {
      setDados(await apiFetch<T>(path));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setCarregando(false);
    }
  }, [path]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { dados, erro, carregando, recarregar, setDados };
}

export const brl = (v: number | string) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Datas "só dia" vêm à meia-noite UTC; formatar em UTC evita voltar um dia.
export const dataBR = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export function formatarDoc(doc: string) {
  const d = doc.replace(/\D/g, '');
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return doc;
}
