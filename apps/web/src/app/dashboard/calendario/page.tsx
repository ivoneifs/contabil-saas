'use client';

import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Botao, Card, Erro, Selo, Titulo, campo, dataBR, useApi } from '@/components/ui';

interface Obrigacao {
  id: string;
  titulo: string;
  competencia: string;
  prazo: string;
  status: 'PENDENTE' | 'EM_ANALISE' | 'ENTREGUE';
  client: { razaoSocial: string };
}

interface Feriado {
  date: string;
  name: string;
}

interface Plano {
  resumo: string;
  alertas: string[];
  dias: { dia: string; foco: string; tarefas: string[] }[];
}

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function competenciaAnterior() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function AgendaInteligentePage() {
  const hoje = new Date();
  const [mes, setMes] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const [competencia, setCompetencia] = useState(competenciaAnterior());
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [planejando, setPlanejando] = useState(false);
  const [diaAberto, setDiaAberto] = useState<string | null>(null);

  const { dados: obrigacoes, recarregar } = useApi<Obrigacao[]>('/obrigacoes-fiscais');
  const { dados: feriados } = useApi<Feriado[]>(`/consultas/feriados/${mes.ano}`);

  const porDia = useMemo(() => {
    const mapa = new Map<string, Obrigacao[]>();
    obrigacoes?.forEach((o) => {
      const k = o.prazo.slice(0, 10);
      mapa.set(k, [...(mapa.get(k) ?? []), o]);
    });
    return mapa;
  }, [obrigacoes]);

  const feriadoDe = useMemo(() => new Map(feriados?.map((f) => [f.date, f.name]) ?? []), [feriados]);

  const primeiro = new Date(Date.UTC(mes.ano, mes.mes, 1));
  const dias = new Date(Date.UTC(mes.ano, mes.mes + 1, 0)).getUTCDate();
  const celulas: (string | null)[] = [
    ...Array(primeiro.getUTCDay()).fill(null),
    ...Array.from({ length: dias }, (_, i) => `${mes.ano}-${String(mes.mes + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`),
  ];
  const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

  async function gerar() {
    setErro(null);
    setAviso(null);
    setGerando(true);
    try {
      const r = await apiFetch<{ criadas: number; jaExistiam: number; clientesSemRegime: string[] }>('/agenda-inteligente/gerar', {
        method: 'POST',
        body: JSON.stringify({ competencia }),
      });
      setAviso(
        `${r.criadas} obrigação(ões) criadas para a competência ${competencia}. ${r.jaExistiam} já existiam.` +
          (r.clientesSemRegime.length ? ` Sem regime tributário (ignorados): ${r.clientesSemRegime.join(', ')}.` : ''),
      );
      await recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar obrigações.');
    } finally {
      setGerando(false);
    }
  }

  async function planejar() {
    setErro(null);
    setPlanejando(true);
    try {
      setPlano(await apiFetch<Plano>('/agenda-inteligente/plano', { method: 'POST' }));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar o plano.');
    } finally {
      setPlanejando(false);
    }
  }

  function mudarMes(delta: number) {
    const d = new Date(mes.ano, mes.mes + delta, 1);
    setMes({ ano: d.getFullYear(), mes: d.getMonth() });
    setDiaAberto(null);
  }

  const doDia = diaAberto ? porDia.get(diaAberto) ?? [] : [];

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="Agenda inteligente"
        subtitulo="Gera as obrigações de cada cliente conforme o regime e os funcionários, com prazos ajustados a fins de semana e feriados nacionais."
      />
      <Erro msg={erro} />
      {aviso && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{aviso}</p>}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">1. Gerar obrigações do mês</h2>
          <p className="mt-1 text-sm text-slate-500">Competência = mês do fato gerador. Os prazos caem no mês seguinte.</p>
          <div className="mt-3 flex gap-2">
            <input type="month" className={campo} value={competencia} onChange={(e) => setCompetencia(e.target.value)} />
            <Botao onClick={gerar} disabled={gerando || !competencia}>
              {gerando ? 'Gerando…' : 'Gerar'}
            </Botao>
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">2. Plano da semana com IA</h2>
          <p className="mt-1 text-sm text-slate-500">A IA distribui as obrigações dos próximos 14 dias entre os dias úteis, priorizando atrasos.</p>
          <Botao className="mt-3" onClick={planejar} disabled={planejando}>
            {planejando ? 'Planejando…' : '✦ Montar plano'}
          </Botao>
        </Card>
      </div>

      {plano && (
        <Card className="mb-6 border-violet-200">
          <p className="text-sm font-medium text-violet-700">✦ Plano da IA</p>
          <p className="mt-2 text-sm">{plano.resumo}</p>
          {!!plano.alertas?.length && (
            <ul className="mt-3 space-y-1">
              {plano.alertas.map((a) => (
                <li key={a} className="text-sm text-rose-700">
                  ⚠ {a}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {plano.dias?.map((d) => (
              <div key={d.dia} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">{dataBR(d.dia)}</p>
                <p className="mt-1 text-sm font-medium">{d.foco}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {d.tarefas.map((t) => (
                    <li key={t}>• {t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Sugestão da IA. Confira os prazos na lista de obrigações.</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <Botao variante="secundario" onClick={() => mudarMes(-1)}>
              ←
            </Botao>
            <h2 className="font-semibold">
              {(() => {
                const t = new Date(mes.ano, mes.mes, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                return t.charAt(0).toUpperCase() + t.slice(1);
              })()}
            </h2>
            <Botao variante="secundario" onClick={() => mudarMes(1)}>
              →
            </Botao>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
            {SEMANA.map((s) => (
              <div key={s} className="py-1">
                {s}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celulas.map((iso, i) => {
              if (!iso) return <div key={`v${i}`} />;
              const lista = porDia.get(iso) ?? [];
              const pendentes = lista.filter((o) => o.status !== 'ENTREGUE').length;
              const feriado = feriadoDe.get(iso);
              const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
              return (
                <button
                  key={iso}
                  onClick={() => setDiaAberto(iso)}
                  title={feriado}
                  className={`min-h-[68px] rounded-lg border p-1.5 text-left text-xs transition hover:border-indigo-400 ${
                    diaAberto === iso ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'
                  } ${feriado || dow === 0 || dow === 6 ? 'bg-slate-50' : 'bg-white'}`}
                >
                  <span className={`font-semibold ${iso === hojeIso ? 'rounded bg-indigo-600 px-1 text-white' : ''}`}>{Number(iso.slice(8))}</span>
                  {feriado && <p className="truncate text-[10px] text-rose-500">{feriado}</p>}
                  {lista.length > 0 && (
                    <p className={`mt-1 rounded px-1 text-[11px] font-medium ${pendentes ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {pendentes ? `${pendentes} pend.` : `${lista.length} ok`}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">{diaAberto ? dataBR(diaAberto) : 'Selecione um dia'}</h2>
          {diaAberto && feriadoDe.get(diaAberto) && <Selo tom="red">Feriado: {feriadoDe.get(diaAberto)}</Selo>}
          {diaAberto && !doDia.length && <p className="mt-2 text-sm text-slate-500">Nenhuma obrigação neste dia.</p>}
          <ul className="mt-2 divide-y divide-slate-100">
            {doDia.map((o) => (
              <li key={o.id} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{o.titulo}</p>
                  <Selo tom={o.status === 'ENTREGUE' ? 'green' : o.status === 'EM_ANALISE' ? 'indigo' : 'amber'}>{o.status.replace('_', ' ').toLowerCase()}</Selo>
                </div>
                <p className="text-xs text-slate-500">
                  {o.client.razaoSocial} · competência {o.competencia}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
