'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Botao, Card, Erro, Indicador, Selo, Tabela, Titulo, Vazio, brl, campo, competenciaBR, useApi } from '@/components/ui';

interface Folha {
  id: string;
  competencia: string;
  status: 'ABERTA' | 'FECHADA';
  totalBruto: string;
  totalInss: string;
  totalIrrf: string;
  totalFgts: string;
  totalLiquido: string;
  client: { razaoSocial: string; cnpjCpf: string };
  _count: { itens: number };
}

const mesAnterior = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};


export default function FolhaPage() {
  const router = useRouter();
  const [competencia, setCompetencia] = useState(mesAnterior());
  const { dados, erro } = useApi<Folha[]>(`/folha?competencia=${competencia}`);
  const { dados: clients } = useApi<{ id: string; razaoSocial: string }[]>('/clients');
  const [clientId, setClientId] = useState('');
  const [abrindo, setAbrindo] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  async function abrir(e: FormEvent) {
    e.preventDefault();
    setFalha(null);
    setAbrindo(true);
    try {
      const f = await apiFetch<{ id: string }>('/folha/abrir', { method: 'POST', body: JSON.stringify({ clientId, competencia }) });
      router.push(`/dashboard/folha/${f.id}`);
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro ao abrir a folha.');
      setAbrindo(false);
    }
  }

  const soma = (k: keyof Folha) => (dados ?? []).reduce((s, f) => s + Number(f[k]), 0);
  const semFolha = (clients ?? []).filter((c) => !dados?.some((f) => f.client.razaoSocial === c.razaoSocial));

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="Folha de pagamento"
        subtitulo="Folha mensal de cada cliente com INSS, IRRF (com a redução da Lei 15.270), FGTS, horas extras, DSR e holerites."
        acoes={<input type="month" className={`${campo} w-auto`} value={competencia} onChange={(e) => setCompetencia(e.target.value)} />}
      />
      <Erro msg={falha ?? erro} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Indicador rotulo={`Folhas ${competenciaBR(competencia)}`} valor={dados?.length ?? '–'} detalhe={`${dados?.filter((f) => f.status === 'FECHADA').length ?? 0} fechadas`} />
        <Indicador rotulo="Bruto" valor={brl(soma('totalBruto'))} />
        <Indicador rotulo="INSS segurados" valor={brl(soma('totalInss'))} tom="amber" />
        <Indicador rotulo="FGTS" valor={brl(soma('totalFgts'))} tom="indigo" />
        <Indicador rotulo="Líquido" valor={brl(soma('totalLiquido'))} tom="green" />
      </div>

      <Card className="mb-6">
        <form onSubmit={abrir} className="flex flex-wrap items-end gap-3">
          <label className="min-w-[260px] flex-1">
            <span className="mb-1 block text-sm font-medium">Abrir folha de {competenciaBR(competencia)} para</span>
            <select className={campo} value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">Selecione o cliente…</option>
              {semFolha.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razaoSocial}
                </option>
              ))}
            </select>
          </label>
          <Botao type="submit" disabled={abrindo || !clientId}>
            {abrindo ? 'Calculando…' : 'Abrir folha'}
          </Botao>
        </form>
        <p className="mt-2 text-xs text-slate-500">Entram todos os funcionários e sócios ativos no mês, com salário proporcional para quem foi admitido ou desligado na competência.</p>
      </Card>

      {!dados?.length ? (
        <Vazio>Nenhuma folha em {competenciaBR(competencia)}.</Vazio>
      ) : (
        <Tabela cabecalho={['Cliente', 'Pessoas', 'Bruto', 'INSS', 'IRRF', 'FGTS', 'Líquido', 'Situação', '']}>
          {dados.map((f) => (
            <tr key={f.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{f.client.razaoSocial}</td>
              <td className="px-4 py-3">{f._count.itens}</td>
              <td className="px-4 py-3 tabular-nums">{brl(f.totalBruto)}</td>
              <td className="px-4 py-3 tabular-nums">{brl(f.totalInss)}</td>
              <td className="px-4 py-3 tabular-nums">{brl(f.totalIrrf)}</td>
              <td className="px-4 py-3 tabular-nums">{brl(f.totalFgts)}</td>
              <td className="px-4 py-3 font-medium tabular-nums">{brl(f.totalLiquido)}</td>
              <td className="px-4 py-3">
                <Selo tom={f.status === 'FECHADA' ? 'green' : 'amber'}>{f.status === 'FECHADA' ? 'Fechada' : 'Aberta'}</Selo>
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={`/dashboard/folha/${f.id}`} className="text-sm font-medium text-indigo-700 hover:underline">
                  Abrir →
                </Link>
              </td>
            </tr>
          ))}
        </Tabela>
      )}
    </main>
  );
}
