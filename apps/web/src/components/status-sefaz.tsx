'use client';

import { Selo, useApi } from '@/components/ui';

interface Autorizador {
  autorizador: string;
  geral: 'online' | 'instavel' | 'offline';
  autorizacao: string | null;
  retornoAutorizacao: string | null;
  inutilizacao: string | null;
  consultaProtocolo: string | null;
  statusServico: string | null;
  tempoMedio: string | null;
  consultaCadastro: string | null;
  recepcaoEvento: string | null;
}

const TOM = { online: 'green', instavel: 'amber', offline: 'red' } as const;
const COLUNAS: [keyof Autorizador, string][] = [
  ['autorizacao', 'Autorização'],
  ['retornoAutorizacao', 'Retorno'],
  ['inutilizacao', 'Inutilização'],
  ['consultaProtocolo', 'Protocolo'],
  ['statusServico', 'Status'],
  ['consultaCadastro', 'Cadastro'],
  ['recepcaoEvento', 'Eventos'],
];

function Bolinha({ v }: { v: string | null }) {
  const cor = v === 'online' ? 'bg-emerald-500' : v === 'instavel' ? 'bg-amber-400' : v === 'offline' ? 'bg-rose-500' : 'bg-slate-200';
  return <span title={v ?? 'sem informação'} className={`inline-block h-2.5 w-2.5 rounded-full ${cor}`} />;
}

// compacto: só o resumo (para o painel).
export default function StatusSefaz({ compacto }: { compacto?: boolean }) {
  const { dados, erro, carregando } = useApi<{ verificadoEm: string | null; autorizadores: Autorizador[] }>('/consultas/sefaz-status');
  if (carregando) return <p className="text-sm text-slate-500">Consultando o portal da NF-e…</p>;
  if (erro || !dados) return <p className="text-sm text-rose-600">{erro ?? 'Status indisponível.'}</p>;

  const fora = dados.autorizadores.filter((a) => a.geral !== 'online');
  if (compacto) {
    return (
      <div>
        <p className="text-3xl font-semibold tabular-nums">
          {dados.autorizadores.length - fora.length}
          <span className="text-base font-normal text-slate-400">/{dados.autorizadores.length}</span>
        </p>
        <p className="text-xs text-slate-500">autorizadores da NF-e online</p>
        {fora.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {fora.map((a) => (
              <Selo key={a.autorizador} tom={TOM[a.geral]}>
                {a.autorizador}: {a.geral === 'instavel' ? 'instável' : 'fora'}
              </Selo>
            ))}
          </div>
        )}
        {dados.verificadoEm && <p className="mt-2 text-[11px] text-slate-400">Portal verificou em {dados.verificadoEm}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-3 font-medium">Autorizador</th>
              {COLUNAS.map(([, n]) => (
                <th key={n} className="px-2 py-2 text-center font-medium">
                  {n}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-medium">Tempo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dados.autorizadores.map((a) => (
              <tr key={a.autorizador}>
                <td className="py-2 pr-3 font-medium">{a.autorizador}</td>
                {COLUNAS.map(([k]) => (
                  <td key={k} className="px-2 py-2 text-center">
                    <Bolinha v={a[k] as string | null} />
                  </td>
                ))}
                <td className="px-2 py-2 text-center text-xs text-slate-500">{a.tempoMedio ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Fonte: Portal Nacional da NF-e{dados.verificadoEm ? `, verificação de ${dados.verificadoEm}` : ''}. Verde = online, amarelo = instável, vermelho = fora do ar.
      </p>
    </div>
  );
}
