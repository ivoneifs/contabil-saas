'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Check, Clock } from 'lucide-react';
import { Card, Selo, useApi } from '@/components/ui';
import { moduloPorSlug } from '@/lib/modulos';

interface Conector {
  id: string;
  nome: string;
  orgao: string;
  status: 'CONECTADO' | 'AGUARDANDO_CREDENCIAL';
  requisitos: { id: string; rotulo: string; ok: boolean }[];
}

const ETAPAS: Record<number, string> = {
  2: 'Etapa 2 · Departamento pessoal (folha, eSocial, INSS e FGTS)',
  3: 'Etapa 3 · Receita Federal, Simples e notas de serviço',
  4: 'Etapa 4 · Contábil, SPED e relatórios',
};

export default function ModuloPlanejadoPage() {
  const { slug } = useParams<{ slug: string }>();
  const modulo = moduloPorSlug(slug);
  const { dados: conectores } = useApi<Conector[]>('/integracoes/catalogo');

  if (!modulo) {
    return <p className="text-sm text-slate-500">Módulo não encontrado.</p>;
  }

  const usados = conectores?.filter((c) => modulo.conectores?.includes(c.id)) ?? [];
  const Icone = modulo.icone;

  return (
    <main className="mx-auto max-w-4xl">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-8 text-white">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15">
            <Icone size={22} />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">{modulo.titulo}</h1>
          <p className="mt-2 max-w-xl text-white/70">{modulo.resumo}</p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-violet-100">
            <Clock size={13} /> {ETAPAS[modulo.etapa] ?? `Etapa ${modulo.etapa}`}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">O que este módulo vai fazer</h2>
          <ul className="mt-3 space-y-2">
            {modulo.recursos?.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-slate-700">
                <Check size={16} className="mt-0.5 shrink-0 text-indigo-600" /> {r}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold">Integrações necessárias</h2>
          {!modulo.conectores?.length ? (
            <p className="mt-3 text-sm text-slate-500">Funciona com os dados do próprio sistema, sem integração externa.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {usados.map((c) => (
                <li key={c.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{c.nome}</p>
                    <Selo tom={c.status === 'CONECTADO' ? 'green' : 'amber'}>{c.status === 'CONECTADO' ? 'Conectado' : 'Aguardando'}</Selo>
                  </div>
                  <p className="text-xs text-slate-500">{c.orgao}</p>
                  <ul className="mt-2 space-y-0.5 text-xs">
                    {c.requisitos.map((r) => (
                      <li key={r.id} className={r.ok ? 'text-emerald-700' : 'text-slate-500'}>
                        {r.ok ? '✓' : '○'} {r.rotulo}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/integracoes" className="mt-4 inline-block text-sm text-indigo-700 hover:underline">
            Abrir a central de integrações →
          </Link>
        </Card>
      </div>
    </main>
  );
}
