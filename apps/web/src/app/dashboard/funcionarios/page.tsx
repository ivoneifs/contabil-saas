'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Erro, Indicador, Selo, Tabela, Titulo, Vazio, brl, campo, dataBR, formatarDoc, useApi } from '@/components/ui';

interface Funcionario {
  id: string;
  clientId: string;
  nome: string;
  cpf: string;
  cargo: string | null;
  salarioBase: string;
  dataAdmissao: string;
  dataDemissao: string | null;
}

interface Client {
  id: string;
  razaoSocial: string;
}

export default function FuncionariosPage() {
  const { dados, erro } = useApi<Funcionario[]>('/funcionarios');
  const { dados: clients } = useApi<Client[]>('/clients');
  const [busca, setBusca] = useState('');
  const [mostrarDesligados, setMostrarDesligados] = useState(false);
  const nome = new Map(clients?.map((c) => [c.id, c.razaoSocial]));
  const termo = busca.trim().toLowerCase();

  const lista = (dados ?? []).filter(
    (f) =>
      (mostrarDesligados || !f.dataDemissao) &&
      (!termo || f.nome.toLowerCase().includes(termo) || (nome.get(f.clientId) ?? '').toLowerCase().includes(termo)),
  );
  const ativos = dados?.filter((f) => !f.dataDemissao) ?? [];
  const folha = ativos.reduce((s, f) => s + Number(f.salarioBase), 0);

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo titulo="Funcionários" subtitulo="Todos os funcionários da carteira. Para cadastrar, abra o cliente." />
      <Erro msg={erro} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Indicador rotulo="Ativos" valor={ativos.length} />
        <Indicador rotulo="Folha base mensal" valor={brl(folha)} tom="indigo" />
        <Indicador rotulo="Empresas com funcionários" valor={new Set(ativos.map((f) => f.clientId)).size} />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input className={`${campo} max-w-sm`} placeholder="Buscar por nome ou empresa…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={mostrarDesligados} onChange={(e) => setMostrarDesligados(e.target.checked)} /> Mostrar desligados
        </label>
      </div>
      {!lista.length ? (
        <Vazio>Nenhum funcionário encontrado.</Vazio>
      ) : (
        <Tabela cabecalho={['Nome', 'CPF', 'Empresa', 'Cargo', 'Salário', 'Admissão', 'Situação']}>
          {lista.map((f) => (
            <tr key={f.id}>
              <td className="px-4 py-2.5 font-medium">{f.nome}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{formatarDoc(f.cpf)}</td>
              <td className="px-4 py-2.5">
                <Link href={`/dashboard/clients/${f.clientId}`} className="text-indigo-700 hover:underline">
                  {nome.get(f.clientId) ?? '—'}
                </Link>
              </td>
              <td className="px-4 py-2.5">{f.cargo ?? '—'}</td>
              <td className="px-4 py-2.5 tabular-nums">{brl(f.salarioBase)}</td>
              <td className="px-4 py-2.5">{dataBR(f.dataAdmissao)}</td>
              <td className="px-4 py-2.5">{f.dataDemissao ? <Selo tom="slate">Desligado</Selo> : <Selo tom="green">Ativo</Selo>}</td>
            </tr>
          ))}
        </Tabela>
      )}
    </main>
  );
}
