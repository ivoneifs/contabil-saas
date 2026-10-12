'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Erro, Indicador, Selo, Tabela, Titulo, Vazio, brl, campo, dataBR, useApi } from '@/components/ui';

interface Lancamento {
  id: string;
  clientId: string;
  tipo: 'A_PAGAR' | 'A_RECEBER';
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO';
  descricao: string;
  valor: string;
  vencimento: string;
  boletoUrl: string | null;
}

interface Client {
  id: string;
  razaoSocial: string;
}

const TOM = { PENDENTE: 'amber', PAGO: 'green', VENCIDO: 'red', CANCELADO: 'slate' } as const;

export default function FinanceiroPage() {
  const { dados, erro } = useApi<Lancamento[]>('/lancamentos');
  const { dados: clients } = useApi<Client[]>('/clients');
  const [tipo, setTipo] = useState('');
  const [status, setStatus] = useState('');
  const nome = new Map(clients?.map((c) => [c.id, c.razaoSocial]));
  const lista = (dados ?? []).filter((l) => (!tipo || l.tipo === tipo) && (!status || l.status === status));
  const soma = (t: Lancamento['tipo']) =>
    (dados ?? []).filter((l) => l.tipo === t && (l.status === 'PENDENTE' || l.status === 'VENCIDO')).reduce((s, l) => s + Number(l.valor), 0);

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo titulo="Contas a pagar e receber" subtitulo="Lançamentos de todos os clientes. Para lançar, abra o cliente." />
      <Erro msg={erro} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Indicador rotulo="A receber em aberto" valor={brl(soma('A_RECEBER'))} tom="green" />
        <Indicador rotulo="A pagar em aberto" valor={brl(soma('A_PAGAR'))} tom="red" />
        <Indicador rotulo="Vencidos" valor={dados?.filter((l) => l.status === 'VENCIDO').length ?? 0} tom="amber" />
      </div>
      <div className="mb-3 flex flex-wrap gap-3">
        <select className={`${campo} max-w-xs`} value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Pagar e receber</option>
          <option value="A_RECEBER">A receber</option>
          <option value="A_PAGAR">A pagar</option>
        </select>
        <select className={`${campo} max-w-xs`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.keys(TOM).map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      {!lista.length ? (
        <Vazio>Nenhum lançamento encontrado.</Vazio>
      ) : (
        <Tabela cabecalho={['Descrição', 'Empresa', 'Tipo', 'Valor', 'Vencimento', 'Status', '']}>
          {lista.map((l) => (
            <tr key={l.id}>
              <td className="px-4 py-2.5 font-medium">{l.descricao}</td>
              <td className="px-4 py-2.5">
                <Link href={`/dashboard/clients/${l.clientId}`} className="text-indigo-700 hover:underline">
                  {nome.get(l.clientId) ?? '—'}
                </Link>
              </td>
              <td className="px-4 py-2.5">{l.tipo === 'A_RECEBER' ? 'Receber' : 'Pagar'}</td>
              <td className={`px-4 py-2.5 tabular-nums ${l.tipo === 'A_RECEBER' ? 'text-emerald-700' : 'text-rose-700'}`}>{brl(l.valor)}</td>
              <td className="px-4 py-2.5">{dataBR(l.vencimento)}</td>
              <td className="px-4 py-2.5">
                <Selo tom={TOM[l.status]}>{l.status.toLowerCase()}</Selo>
              </td>
              <td className="px-4 py-2.5 text-right">
                {l.boletoUrl && (
                  <a href={l.boletoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">
                    Boleto ↗
                  </a>
                )}
              </td>
            </tr>
          ))}
        </Tabela>
      )}
    </main>
  );
}
