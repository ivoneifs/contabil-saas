'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Card, Erro, Indicador, Selo, Titulo, Vazio, brl, campo, competenciaBR, dataBR, useApi } from '@/components/ui';

interface ClienteEncargos {
  folhaId: string;
  status: 'ABERTA' | 'FECHADA';
  cliente: { id: string; razaoSocial: string; regimeTributario: string | null };
  pessoas: number;
  baseInss: number;
  inssSegurados: number;
  inssPatronal: number;
  rat: number;
  terceiros: number;
  totalInss: number;
  estimativaPatronal: boolean;
  baseFgts: number;
  fgts: number;
  porPessoa: { nome: string; vinculo: string; baseInss: number; inss: number; baseFgts: number; fgts: number }[];
}

interface Encargos {
  competencia: string;
  vencimentoFgts: string;
  vencimentoInss: string;
  clientes: ClienteEncargos[];
}

const mesAnterior = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function EncargosView({ tipo }: { tipo: 'INSS' | 'FGTS' }) {
  const [competencia, setCompetencia] = useState(mesAnterior());
  const { dados, erro } = useApi<Encargos>(`/folha/encargos?competencia=${competencia}`);
  const [aberto, setAberto] = useState<string | null>(null);
  const inss = tipo === 'INSS';
  const soma = (k: keyof ClienteEncargos) => (dados?.clientes ?? []).reduce((s, c) => s + Number(c[k]), 0);

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo={inss ? 'INSS' : 'FGTS Digital'}
        subtitulo={
          inss
            ? 'Contribuições previdenciárias da competência, por cliente. O DARF sai pela DCTFWeb (Integra Contador).'
            : 'FGTS mensal por cliente e funcionário, a recolher pela guia do FGTS Digital (GFD).'
        }
        acoes={<input type="month" className={`${campo} w-auto`} value={competencia} onChange={(e) => setCompetencia(e.target.value)} />}
      />
      <Erro msg={erro} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {inss ? (
          <>
            <Indicador rotulo="Segurados (descontado)" valor={brl(soma('inssSegurados'))} />
            <Indicador rotulo="Patronal + RAT + terceiros" valor={brl(soma('inssPatronal') + soma('rat') + soma('terceiros'))} tom="amber" detalhe="estimativa para Lucro Presumido/Real" />
            <Indicador rotulo="Total" valor={brl(soma('totalInss'))} tom="indigo" />
          </>
        ) : (
          <>
            <Indicador rotulo="Base do FGTS" valor={brl(soma('baseFgts'))} />
            <Indicador rotulo="FGTS a recolher" valor={brl(soma('fgts'))} tom="indigo" />
            <Indicador rotulo="Clientes" valor={dados?.clientes.length ?? '–'} />
          </>
        )}
        <Indicador rotulo="Vencimento" valor={dados ? dataBR(inss ? dados.vencimentoInss : dados.vencimentoFgts) : '–'} tom="red" detalhe="dia 20, antecipado se não for dia útil" />
      </div>

      {!dados?.clientes.length ? (
        <Vazio>
          Nenhuma folha em {competenciaBR(competencia)}.{' '}
          <Link href="/dashboard/folha" className="text-indigo-700 underline">
            Abrir folhas
          </Link>
        </Vazio>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {(inss ? ['Cliente', 'Pessoas', 'Base', 'Segurados', 'Patronal 20%', 'RAT 2%', 'Terceiros 5,8%', 'Total', 'Folha'] : ['Cliente', 'Pessoas', 'Base FGTS', 'FGTS', 'Folha']).map((c) => (
                  <th key={c} className="whitespace-nowrap px-4 py-3 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dados.clientes.map((c) => (
                <Fragment key={c.folhaId}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <button className="text-left font-medium hover:text-indigo-700" onClick={() => setAberto(aberto === c.folhaId ? null : c.folhaId)}>
                        {c.cliente.razaoSocial}
                      </button>
                      {inss && !c.estimativaPatronal && <p className="text-xs text-slate-500">Simples/MEI: patronal no DAS (exceto anexo IV)</p>}
                    </td>
                    <td className="px-4 py-2.5">{c.pessoas}</td>
                    {inss ? (
                      <>
                        <td className="px-4 py-2.5 tabular-nums">{brl(c.baseInss)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{brl(c.inssSegurados)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{brl(c.inssPatronal)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{brl(c.rat)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{brl(c.terceiros)}</td>
                        <td className="px-4 py-2.5 font-semibold tabular-nums">{brl(c.totalInss)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 tabular-nums">{brl(c.baseFgts)}</td>
                        <td className="px-4 py-2.5 font-semibold tabular-nums">{brl(c.fgts)}</td>
                      </>
                    )}
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/folha/${c.folhaId}`}>
                        <Selo tom={c.status === 'FECHADA' ? 'green' : 'amber'}>{c.status === 'FECHADA' ? 'Fechada' : 'Aberta'}</Selo>
                      </Link>
                    </td>
                  </tr>
                  {aberto === c.folhaId && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={inss ? 9 : 5} className="px-4 py-3">
                        <table className="w-full text-xs">
                          <tbody>
                            {c.porPessoa.map((p) => (
                              <tr key={p.nome} className="border-b border-slate-100 last:border-0">
                                <td className="py-1">{p.nome}</td>
                                <td className="py-1 text-slate-500">{p.vinculo === 'SOCIO' ? 'sócio' : p.vinculo.toLowerCase()}</td>
                                <td className="py-1 text-right tabular-nums">base {brl(inss ? p.baseInss : p.baseFgts)}</td>
                                <td className="py-1 text-right font-medium tabular-nums">{brl(inss ? p.inss : p.fgts)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {inss && (
        <Card className="mt-4">
          <p className="text-xs text-slate-500">
            A cota patronal é uma estimativa: RAT/FAP varia de 0,5% a 6% conforme o CNAE, e terceiros de 0% a 5,8%. Confira a classificação de cada cliente
            antes de recolher. Empresas do Simples Nacional (exceto anexo IV) pagam a cota patronal dentro do DAS.
          </p>
        </Card>
      )}
    </main>
  );
}
