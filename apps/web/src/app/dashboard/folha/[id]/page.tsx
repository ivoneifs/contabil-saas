'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Pencil, Plus, Printer, RefreshCw, Trash2, Unlock, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { usePode } from '@/lib/permissoes';
import { Botao, Erro, Indicador, Modal, Selo, brl, campo, competenciaBR } from '@/components/ui';

interface Rubrica {
  codigo: string;
  descricao: string;
  referencia?: string;
  provento?: number;
  desconto?: number;
}

interface Lancamentos {
  horasExtras50: number;
  horasExtras100: number;
  faltasDias: number;
  outrosProventos: { descricao: string; valor: number; tributavel?: boolean }[];
  outrosDescontos: { descricao: string; valor: number }[];
}

export interface ItemFolha {
  id: string;
  lancamentos: Lancamentos;
  resultado: {
    rubricas: Rubrica[];
    bruto: number;
    baseInss: number;
    inss: number;
    baseIrrf: number;
    irrf: { imposto: number; reducao: number; usouSimplificado: boolean; base: number };
    baseFgts: number;
    fgts: number;
    descontos: number;
    liquido: number;
    diasTrabalhados: number;
  };
  bruto: string;
  inss: string;
  irrf: string;
  fgts: string;
  liquido: string;
  funcionario: { id: string; nome: string; cpf: string; cargo: string | null; cbo: string | null; matricula: string | null; vinculo: string; salarioBase: string; dataAdmissao: string; dependentesIrrf: number };
}

export interface FolhaDetalhe {
  id: string;
  competencia: string;
  status: 'ABERTA' | 'FECHADA';
  totalBruto: string;
  totalInss: string;
  totalIrrf: string;
  totalFgts: string;
  totalLiquido: string;
  fechadaEm: string | null;
  client: { id: string; razaoSocial: string; cnpjCpf: string; municipio: string | null; uf: string };
  itens: ItemFolha[];
  fontes: string[];
}

function EditorLancamentos({ item, onSalvar }: { item: ItemFolha; onSalvar: (l: Lancamentos) => Promise<void> }) {
  const [l, setL] = useState<Lancamentos>(item.lancamentos);
  const [salvando, setSalvando] = useState(false);
  const num = (k: 'horasExtras50' | 'horasExtras100' | 'faltasDias') => (e: React.ChangeEvent<HTMLInputElement>) => setL({ ...l, [k]: Number(e.target.value) || 0 });
  const socio = item.funcionario.vinculo === 'SOCIO';

  return (
    <div className="space-y-5">
      {!socio && (
        <div className="grid gap-3 sm:grid-cols-3">
          <label>
            <span className="mb-1 block text-sm font-medium">Horas extras 50%</span>
            <input type="number" step="0.5" min="0" className={campo} value={l.horasExtras50} onChange={num('horasExtras50')} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">Horas extras 100%</span>
            <input type="number" step="0.5" min="0" className={campo} value={l.horasExtras100} onChange={num('horasExtras100')} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium">Faltas (dias)</span>
            <input type="number" step="1" min="0" max="30" className={campo} value={l.faltasDias} onChange={num('faltasDias')} />
          </label>
        </div>
      )}

      {(['outrosProventos', 'outrosDescontos'] as const).map((tipo) => (
        <div key={tipo}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">{tipo === 'outrosProventos' ? 'Outros proventos (comissão, bônus, adicional…)' : 'Outros descontos (adiantamento, convênio…)'}</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:underline"
              onClick={() => setL({ ...l, [tipo]: [...l[tipo], { descricao: '', valor: 0 }] })}
            >
              <Plus size={13} /> Incluir
            </button>
          </div>
          {!l[tipo].length && <p className="text-xs text-slate-400">Nenhum.</p>}
          <div className="space-y-2">
            {l[tipo].map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  className={`${campo} min-w-[180px] flex-1`}
                  placeholder="Descrição"
                  value={r.descricao}
                  onChange={(e) => setL({ ...l, [tipo]: l[tipo].map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)) })}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${campo} w-32`}
                  placeholder="Valor"
                  value={r.valor || ''}
                  onChange={(e) => setL({ ...l, [tipo]: l[tipo].map((x, j) => (j === i ? { ...x, valor: Number(e.target.value) } : x)) })}
                />
                {tipo === 'outrosProventos' && (
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={(r as { tributavel?: boolean }).tributavel !== false}
                      onChange={(e) => setL({ ...l, outrosProventos: l.outrosProventos.map((x, j) => (j === i ? { ...x, tributavel: e.target.checked } : x)) })}
                    />
                    tributável
                  </label>
                )}
                <button type="button" aria-label="Remover" onClick={() => setL({ ...l, [tipo]: l[tipo].filter((_, j) => j !== i) })} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Botao
          disabled={salvando}
          onClick={async () => {
            setSalvando(true);
            await onSalvar(l);
            setSalvando(false);
          }}
        >
          {salvando ? 'Calculando…' : 'Salvar e recalcular'}
        </Botao>
      </div>
    </div>
  );
}

export default function FolhaDetalhePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pode = usePode();
  const [folha, setFolha] = useState<FolhaDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<ItemFolha | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setFolha(await apiFetch<FolhaDetalhe>(`/folha/${params.id}`));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar.');
    }
  }, [params.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function acao(caminho: string, metodo = 'POST') {
    setErro(null);
    setOcupado(true);
    try {
      const r = await apiFetch<FolhaDetalhe | { ok: true }>(`/folha/${params.id}${caminho}`, { method: metodo });
      if ('itens' in r) setFolha(r);
      else router.push('/dashboard/folha');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro.');
    } finally {
      setOcupado(false);
    }
  }

  async function salvarItem(item: ItemFolha, l: Lancamentos) {
    try {
      setFolha(await apiFetch<FolhaDetalhe>(`/folha/${params.id}/itens/${item.id}`, { method: 'PATCH', body: JSON.stringify(l) }));
      setEditando(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
    }
  }

  if (!folha) return <main className="mx-auto max-w-7xl">{erro ? <Erro msg={erro} /> : <p className="text-sm text-slate-500">Carregando…</p>}</main>;
  const aberta = folha.status === 'ABERTA';

  return (
    <main className="mx-auto max-w-7xl">
      <Link href="/dashboard/folha" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-700">
        <ArrowLeft size={15} /> Folhas
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Folha {competenciaBR(folha.competencia)} · {folha.client.razaoSocial}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            <Selo tom={aberta ? 'amber' : 'green'}>{aberta ? 'Aberta' : `Fechada em ${new Date(folha.fechadaEm!).toLocaleDateString('pt-BR')}`}</Selo>
            <span className="ml-2">{folha.itens.length} pessoa(s)</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/folha/${folha.id}/holerites`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer size={15} /> Holerites
          </Link>
          {pode('pessoal') && aberta && (
            <>
              <Botao variante="secundario" className="inline-flex items-center gap-1.5" disabled={ocupado} onClick={() => acao('/recalcular')}>
                <RefreshCw size={15} /> Recalcular
              </Botao>
              <Botao className="inline-flex items-center gap-1.5" disabled={ocupado} onClick={() => window.confirm('Fechar a folha? Os eventos S-1200 e S-1299 entram nas pendências do eSocial.') && acao('/fechar')}>
                <Lock size={15} /> Fechar folha
              </Botao>
              <Botao variante="perigo" className="inline-flex items-center gap-1.5" disabled={ocupado} onClick={() => window.confirm('Excluir esta folha?') && acao('', 'DELETE')}>
                <Trash2 size={15} />
              </Botao>
            </>
          )}
          {pode('pessoal') && !aberta && (
            <Botao variante="secundario" className="inline-flex items-center gap-1.5" disabled={ocupado} onClick={() => acao('/reabrir')}>
              <Unlock size={15} /> Reabrir
            </Botao>
          )}
        </div>
      </div>
      <Erro msg={erro} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Indicador rotulo="Bruto" valor={brl(folha.totalBruto)} />
        <Indicador rotulo="INSS segurados" valor={brl(folha.totalInss)} tom="amber" />
        <Indicador rotulo="IRRF" valor={brl(folha.totalIrrf)} tom="amber" />
        <Indicador rotulo="FGTS (empresa)" valor={brl(folha.totalFgts)} tom="indigo" />
        <Indicador rotulo="Líquido a pagar" valor={brl(folha.totalLiquido)} tom="green" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Nome', 'Dias', 'Variáveis', 'Bruto', 'INSS', 'IRRF', 'Descontos', 'Líquido', 'FGTS', ''].map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {folha.itens.map((i) => {
              const l = i.lancamentos;
              const variaveis = [
                l.horasExtras50 ? `HE50 ${l.horasExtras50}h` : '',
                l.horasExtras100 ? `HE100 ${l.horasExtras100}h` : '',
                l.faltasDias ? `${l.faltasDias} falta(s)` : '',
                l.outrosProventos.length ? `+${l.outrosProventos.length} provento(s)` : '',
                l.outrosDescontos.length ? `−${l.outrosDescontos.length} desconto(s)` : '',
              ].filter(Boolean);
              return (
                <Fragment key={i.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <button className="text-left font-medium hover:text-indigo-700" onClick={() => setAberto(aberto === i.id ? null : i.id)}>
                        {i.funcionario.nome}
                      </button>
                      <p className="text-xs text-slate-500">
                        {i.funcionario.cargo ?? '—'} {i.funcionario.vinculo === 'SOCIO' && <Selo tom="violet">pró-labore</Selo>}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">{i.resultado.diasTrabalhados}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{variaveis.join(' · ') || '—'}</td>
                    <td className="px-3 py-2.5 tabular-nums">{brl(i.bruto)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{brl(i.inss)}</td>
                    <td className="px-3 py-2.5 tabular-nums" title={i.resultado.irrf.reducao ? `Redução Lei 15.270: ${brl(i.resultado.irrf.reducao)}` : undefined}>
                      {brl(i.irrf)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{brl(i.resultado.descontos)}</td>
                    <td className="px-3 py-2.5 font-semibold tabular-nums">{brl(i.liquido)}</td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-500">{brl(i.fgts)}</td>
                    <td className="px-3 py-2.5 text-right">
                      {pode('pessoal') && aberta && (
                        <button title="Lançar variáveis" onClick={() => setEditando(i)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                          <Pencil size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                  {aberto === i.id && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={10} className="px-3 py-3">
                        <div className="grid gap-4 md:grid-cols-2">
                          <table className="w-full text-xs">
                            <tbody>
                              {i.resultado.rubricas.map((r, k) => (
                                <tr key={k} className="border-b border-slate-100 last:border-0">
                                  <td className="py-1 pr-2 font-mono text-slate-400">{r.codigo}</td>
                                  <td className="py-1 pr-2">{r.descricao}</td>
                                  <td className="py-1 pr-2 text-slate-500">{r.referencia}</td>
                                  <td className="py-1 text-right tabular-nums text-emerald-700">{r.provento ? brl(r.provento) : ''}</td>
                                  <td className="py-1 text-right tabular-nums text-rose-700">{r.desconto ? brl(r.desconto) : ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <dl className="grid grid-cols-2 gap-2 text-xs">
                            <dt className="text-slate-500">Base INSS</dt>
                            <dd className="text-right tabular-nums">{brl(i.resultado.baseInss)}</dd>
                            <dt className="text-slate-500">Base IRRF {i.resultado.irrf.usouSimplificado ? '(desconto simplificado)' : ''}</dt>
                            <dd className="text-right tabular-nums">{brl(i.resultado.irrf.base)}</dd>
                            <dt className="text-slate-500">Redução IRRF (Lei 15.270)</dt>
                            <dd className="text-right tabular-nums">{brl(i.resultado.irrf.reducao)}</dd>
                            <dt className="text-slate-500">Base FGTS</dt>
                            <dd className="text-right tabular-nums">{brl(i.resultado.baseFgts)}</dd>
                          </dl>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">Clique no nome para ver as rubricas. Tabelas: {folha.fontes.join(' · ')}.</p>

      <Modal aberto={!!editando} titulo={`Variáveis de ${competenciaBR(folha.competencia)} · ${editando?.funcionario.nome ?? ''}`} onFechar={() => setEditando(null)} largura="max-w-2xl">
        {editando && <EditorLancamentos key={editando.id} item={editando} onSalvar={(l) => salvarItem(editando, l)} />}
      </Modal>
    </main>
  );
}
