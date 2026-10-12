'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Calculator, Printer, Save, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { usePode } from '@/lib/permissoes';
import type { Funcionario } from '@/components/funcionario-form';
import { Botao, Card, Campo, Erro, Selo, Titulo, Vazio, brl, campo, formatarDoc, useApi } from '@/components/ui';

type Tipo = 'FERIAS' | 'DECIMO_TERCEIRO' | 'RESCISAO';

interface Rubrica {
  codigo: string;
  descricao: string;
  referencia?: string;
  provento?: number;
  desconto?: number;
}

interface Salvo {
  id: string;
  tipo: Tipo;
  liquido: string;
  createdAt: string;
  parametros: Record<string, unknown>;
  resultado: Record<string, unknown>;
  funcionario: { nome: string; cpf: string; client: { razaoSocial: string } };
}

const TITULOS: Record<Tipo, string> = { FERIAS: 'Férias', DECIMO_TERCEIRO: '13º salário', RESCISAO: 'Rescisão' };
const TIPOS_RESCISAO = {
  SEM_JUSTA_CAUSA: 'Dispensa sem justa causa',
  PEDIDO_DEMISSAO: 'Pedido de demissão',
  ACORDO: 'Acordo (art. 484-A da CLT)',
  TERMINO_CONTRATO: 'Término de contrato (experiência/prazo)',
  JUSTA_CAUSA: 'Dispensa por justa causa',
};
const AVISOS = { INDENIZADO: 'Indenizado', TRABALHADO: 'Trabalhado', NAO_CUMPRIDO: 'Não cumprido pelo empregado', DISPENSADO: 'Dispensado / não se aplica' };

// Transforma qualquer resultado em lista de rubricas + resumo para exibir.
function rubricasDe(tipo: Tipo, r: Record<string, unknown>): Rubrica[] {
  if (tipo === 'DECIMO_TERCEIRO') {
    const x = r as { avos: number; total: number; valor: number; inss: number; irrf: number };
    const lista: Rubrica[] = [{ codigo: '0500', descricao: '13º salário', referencia: `${x.avos}/12`, provento: x.valor }];
    if (x.inss) lista.push({ codigo: '0200', descricao: 'INSS sobre 13º', desconto: x.inss });
    if (x.irrf) lista.push({ codigo: '0210', descricao: 'IRRF sobre 13º', desconto: x.irrf });
    return lista;
  }
  return (r.rubricas as Rubrica[]) ?? [];
}

function Resultado({ tipo, r, funcionario }: { tipo: Tipo; r: Record<string, unknown>; funcionario?: Funcionario }) {
  const rubricas = rubricasDe(tipo, r);
  const proventos = rubricas.reduce((s, x) => s + (x.provento ?? 0), 0);
  const descontos = rubricas.reduce((s, x) => s + (x.desconto ?? 0), 0);
  const resc = tipo === 'RESCISAO' ? (r as { diasAviso: number; dataProjetada: string; prazoPagamento: string; fgts: { depositoMes: number; multa: number; percentualMulta: number; saque: string; seguroDesemprego: boolean } }) : null;
  return (
    <div className="recibo text-sm">
      {funcionario && (
        <p className="mb-3 hidden text-base font-semibold print:block">
          {TITULOS[tipo]} · {funcionario.nome} · CPF {formatarDoc(funcionario.cpf)}
        </p>
      )}
      <table className="w-full">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2 text-left font-medium">Descrição</th>
            <th className="py-2 text-right font-medium">Referência</th>
            <th className="py-2 text-right font-medium">Proventos</th>
            <th className="py-2 text-right font-medium">Descontos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rubricas.map((x, i) => (
            <tr key={i}>
              <td className="py-1.5">{x.descricao}</td>
              <td className="py-1.5 text-right text-slate-500">{x.referencia}</td>
              <td className="py-1.5 text-right tabular-nums text-emerald-700">{x.provento ? brl(x.provento) : ''}</td>
              <td className="py-1.5 text-right tabular-nums text-rose-700">{x.desconto ? brl(x.desconto) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-slate-200 font-semibold">
          <tr>
            <td className="py-2" colSpan={2}>
              Totais
            </td>
            <td className="py-2 text-right tabular-nums">{brl(proventos)}</td>
            <td className="py-2 text-right tabular-nums">{brl(descontos)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-3">
        <span className="font-medium text-indigo-900">Líquido a pagar</span>
        <span className="text-xl font-semibold tabular-nums text-indigo-900">{brl(Number(r.liquido))}</span>
      </div>
      {resc && (
        <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3">
            <dt className="text-slate-500">Aviso prévio e projeção</dt>
            <dd className="font-medium">
              {resc.diasAviso} dias · data projetada {resc.dataProjetada.split('-').reverse().join('/')}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <dt className="text-slate-500">Prazo de pagamento</dt>
            <dd className="font-medium">até {resc.prazoPagamento.split('-').reverse().join('/')} (10 dias)</dd>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <dt className="text-slate-500">FGTS do mês da rescisão</dt>
            <dd className="font-medium">{brl(resc.fgts.depositoMes)}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <dt className="text-slate-500">Multa do FGTS ({resc.fgts.percentualMulta * 100}%)</dt>
            <dd className="font-medium">
              {brl(resc.fgts.multa)} · saque: {resc.fgts.saque}
              {resc.fgts.seguroDesemprego ? ' · tem direito a seguro-desemprego' : ''}
            </dd>
          </div>
        </dl>
      )}
      {typeof r.observacao === 'string' && <p className="mt-3 text-xs text-slate-500">{r.observacao}</p>}
      <div className="mt-10 hidden grid-cols-2 gap-10 text-center text-xs print:grid">
        <p className="border-t border-slate-600 pt-1">Empregador</p>
        <p className="border-t border-slate-600 pt-1">Empregado</p>
      </div>
    </div>
  );
}

export default function FeriasRescisoesPage() {
  const pode = usePode();
  const { dados: funcionarios } = useApi<Funcionario[]>('/funcionarios');
  const { dados: clients } = useApi<{ id: string; razaoSocial: string }[]>('/clients');
  const { dados: salvos, recarregar } = useApi<Salvo[]>('/calculos-trabalhistas');
  const [tipo, setTipo] = useState<Tipo>('FERIAS');
  const [funcionarioId, setFuncionarioId] = useState('');
  const [p, setP] = useState<Record<string, string>>({ dias: '30', abonoDias: '0', parcela: 'SEGUNDA', ano: String(new Date().getFullYear()), tipoRescisao: 'SEM_JUSTA_CAUSA', aviso: 'INDENIZADO', feriasVencidas: '0', saldoFgts: '0', mediaVariaveis: '0' });
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [ver, setVer] = useState<Salvo | null>(null);

  const nomeCliente = useMemo(() => new Map(clients?.map((c) => [c.id, c.razaoSocial])), [clients]);
  const elegiveis = (funcionarios ?? []).filter((f) => f.vinculo !== 'SOCIO' && (tipo === 'RESCISAO' || !f.dataDemissao));
  const funcionario = funcionarios?.find((f) => f.id === funcionarioId);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setP({ ...p, [k]: e.target.value });
    setResultado(null);
  };

  async function calcular(salvar: boolean, e?: FormEvent) {
    e?.preventDefault();
    setErro(null);
    setOk(null);
    try {
      const r = await apiFetch<{ resultado: Record<string, unknown>; salvo: { id: string } | null }>('/calculos-trabalhistas', {
        method: 'POST',
        body: JSON.stringify({ funcionarioId, tipo, parametros: p, salvar }),
      });
      setResultado(r.resultado);
      if (salvar) {
        setOk(tipo === 'RESCISAO' ? 'Rescisão salva. O desligamento foi registrado e o S-2299 entrou nas pendências do eSocial.' : 'Cálculo salvo.');
        recarregar();
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro no cálculo.');
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      <div className="print:hidden">
        <Titulo titulo="Férias, 13º e rescisões" subtitulo="Cálculo com as tabelas de INSS e IRRF vigentes, recibo para imprimir e histórico por funcionário." />
        <Erro msg={erro} />
        {ok && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 print:hidden">
          <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
            {(Object.keys(TITULOS) as Tipo[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTipo(t);
                  setResultado(null);
                }}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${tipo === t ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {TITULOS[t]}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => calcular(false, e)} className="space-y-3">
            <Campo rotulo="Funcionário">
              <select className={campo} value={funcionarioId} onChange={(e) => { setFuncionarioId(e.target.value); setResultado(null); }} required>
                <option value="">Selecione…</option>
                {elegiveis.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome} · {nomeCliente.get(f.clientId) ?? ''}
                  </option>
                ))}
              </select>
            </Campo>
            {funcionario && (
              <p className="text-xs text-slate-500">
                Salário {brl(funcionario.salarioBase)} · admissão {new Date(funcionario.dataAdmissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} · {funcionario.dependentesIrrf} dependente(s)
              </p>
            )}
            <Campo rotulo="Média de variáveis (horas extras, comissões)" dica="Média mensal dos últimos 12 meses, se houver.">
              <input type="number" step="0.01" min="0" className={campo} value={p.mediaVariaveis} onChange={set('mediaVariaveis')} />
            </Campo>

            {tipo === 'FERIAS' && (
              <div className="grid grid-cols-2 gap-3">
                <Campo rotulo="Dias de férias">
                  <input type="number" min={5} max={30} className={campo} value={p.dias} onChange={set('dias')} />
                </Campo>
                <Campo rotulo="Abono pecuniário (dias)" dica="Venda de até 10 dias.">
                  <input type="number" min={0} max={10} className={campo} value={p.abonoDias} onChange={set('abonoDias')} />
                </Campo>
              </div>
            )}

            {tipo === 'DECIMO_TERCEIRO' && (
              <div className="grid grid-cols-2 gap-3">
                <Campo rotulo="Parcela">
                  <select className={campo} value={p.parcela} onChange={set('parcela')}>
                    <option value="PRIMEIRA">1ª parcela (até 30/11)</option>
                    <option value="SEGUNDA">2ª parcela (até 20/12)</option>
                  </select>
                </Campo>
                <Campo rotulo="Ano">
                  <input type="number" className={campo} value={p.ano} onChange={set('ano')} />
                </Campo>
              </div>
            )}

            {tipo === 'RESCISAO' && (
              <>
                <Campo rotulo="Tipo de desligamento">
                  <select className={campo} value={p.tipoRescisao} onChange={set('tipoRescisao')}>
                    {Object.entries(TIPOS_RESCISAO).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Campo>
                <div className="grid grid-cols-2 gap-3">
                  <Campo rotulo="Data do desligamento">
                    <input type="date" className={campo} value={p.desligamento ?? ''} onChange={set('desligamento')} required />
                  </Campo>
                  <Campo rotulo="Aviso prévio">
                    <select className={campo} value={p.aviso} onChange={set('aviso')}>
                      {Object.entries(AVISOS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </Campo>
                  <Campo rotulo="Férias vencidas (períodos)">
                    <input type="number" min={0} max={3} className={campo} value={p.feriasVencidas} onChange={set('feriasVencidas')} />
                  </Campo>
                  <Campo rotulo="Saldo do FGTS (R$)" dica="Para a multa rescisória.">
                    <input type="number" step="0.01" min="0" className={campo} value={p.saldoFgts} onChange={set('saldoFgts')} />
                  </Campo>
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Botao type="submit" className="inline-flex items-center gap-1.5" disabled={!funcionarioId}>
                <Calculator size={15} /> Calcular
              </Botao>
              {pode('pessoal') && resultado && (
                <Botao type="button" variante="secundario" className="inline-flex items-center gap-1.5" onClick={() => calcular(true)}>
                  <Save size={15} /> Salvar
                </Botao>
              )}
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-3 print:border-0 print:shadow-none">
          {!resultado ? (
            <p className="py-16 text-center text-sm text-slate-500 print:hidden">Preencha e clique em Calcular.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between print:hidden">
                <h2 className="font-semibold">
                  {TITULOS[tipo]} · {funcionario?.nome}
                </h2>
                <Botao variante="secundario" className="inline-flex items-center gap-1.5" onClick={() => window.print()}>
                  <Printer size={15} /> Imprimir
                </Botao>
              </div>
              <Resultado tipo={tipo} r={resultado} funcionario={funcionario} />
            </>
          )}
        </Card>
      </div>

      <section className="mt-8 print:hidden">
        <h2 className="mb-3 font-semibold">Cálculos salvos</h2>
        {!salvos?.length ? (
          <Vazio>Nenhum cálculo salvo ainda.</Vazio>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {['Tipo', 'Funcionário', 'Empresa', 'Líquido', 'Data', ''].map((c) => (
                    <th key={c} className="px-4 py-3 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salvos.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5">
                      <Selo tom={s.tipo === 'RESCISAO' ? 'red' : s.tipo === 'FERIAS' ? 'green' : 'indigo'}>{TITULOS[s.tipo]}</Selo>
                    </td>
                    <td className="px-4 py-2.5 font-medium">{s.funcionario.nome}</td>
                    <td className="px-4 py-2.5">{s.funcionario.client.razaoSocial}</td>
                    <td className="px-4 py-2.5 tabular-nums">{brl(s.liquido)}</td>
                    <td className="px-4 py-2.5">{new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button className="mr-2 text-sm text-indigo-700 hover:underline" onClick={() => setVer(ver?.id === s.id ? null : s)}>
                        {ver?.id === s.id ? 'Fechar' : 'Ver'}
                      </button>
                      {pode('pessoal') && (
                        <button
                          title="Excluir"
                          className="rounded p-1.5 text-rose-500 hover:bg-rose-50"
                          onClick={async () => {
                            if (!window.confirm('Excluir este cálculo?')) return;
                            await apiFetch(`/calculos-trabalhistas/${s.id}`, { method: 'DELETE' });
                            recarregar();
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {ver && (
          <Card className="mt-4">
            <h3 className="mb-3 font-semibold">
              {TITULOS[ver.tipo]} · {ver.funcionario.nome}
            </h3>
            <Resultado tipo={ver.tipo} r={ver.resultado} />
          </Card>
        )}
      </section>
    </main>
  );
}
