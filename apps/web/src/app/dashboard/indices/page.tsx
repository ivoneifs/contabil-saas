'use client';

import { Card, Erro, Titulo, useApi } from '@/components/ui';

interface Indice {
  codigo: number;
  sigla: string;
  nome: string;
  valores: { mes: string; valor: number }[];
  ultimo: { mes: string; valor: number } | null;
  acumulado12m: number | null;
  erro: string | null;
}

const pct = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const mesBR = (m: string) => {
  const [a, mm] = m.split('-');
  return new Date(Number(a), Number(mm) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
};

function Barras({ valores }: { valores: Indice['valores'] }) {
  const max = Math.max(...valores.map((v) => Math.abs(v.valor)), 0.01);
  return (
    <div className="mt-4 flex h-24 items-end gap-1" role="img" aria-label="Variação mensal">
      {valores.map((v) => (
        <div key={v.mes} className="group relative flex-1">
          <div
            className={`w-full rounded-t ${v.valor < 0 ? 'bg-rose-400' : 'bg-indigo-500/80 group-hover:bg-indigo-600'}`}
            style={{ height: `${Math.max(4, (Math.abs(v.valor) / max) * 88)}px` }}
          />
          <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
            {mesBR(v.mes)}: {pct(v.valor)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function IndicesPage() {
  const { dados, erro, carregando } = useApi<Indice[]>('/consultas/indices');

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo titulo="Índices econômicos" subtitulo="Séries oficiais do Banco Central (SGS). Variação mensal dos últimos 12 meses fechados e acumulado no período." />
      <Erro msg={erro} />
      {carregando && <p className="text-sm text-slate-500">Consultando o Banco Central…</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dados?.map((i) => (
          <Card key={i.codigo}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold">{i.sigla}</p>
                <p className="text-xs text-slate-500">
                  {i.nome} · série {i.codigo}
                </p>
              </div>
              {i.ultimo && (
                <div className="text-right">
                  <p className="text-xl font-semibold tabular-nums">{pct(i.ultimo.valor)}</p>
                  <p className="text-xs text-slate-500">{mesBR(i.ultimo.mes)}</p>
                </div>
              )}
            </div>
            {i.erro ? (
              <p className="mt-4 text-sm text-rose-600">{i.erro}</p>
            ) : (
              <>
                <Barras valores={i.valores} />
                <p className="mt-3 text-sm text-slate-600">
                  Acumulado 12 meses: <b className="tabular-nums">{i.acumulado12m !== null ? pct(i.acumulado12m) : '—'}</b>
                </p>
              </>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}
