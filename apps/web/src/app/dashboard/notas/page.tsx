'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Erro, Indicador, Selo, Tabela, Titulo, Vazio, brl, campo, useApi } from '@/components/ui';

interface Nota {
  id: string;
  clientId: string;
  tipo: string;
  status: 'RASCUNHO' | 'ENVIADA' | 'AUTORIZADA' | 'REJEITADA' | 'CANCELADA';
  numero: string | null;
  serie: string | null;
  uf: string;
  chaveAcesso: string | null;
  danfeUrl: string | null;
  valorTotal: string;
  motivoRejeicao: string | null;
  createdAt: string;
}

interface Client {
  id: string;
  razaoSocial: string;
}

const TOM = { RASCUNHO: 'slate', ENVIADA: 'indigo', AUTORIZADA: 'green', REJEITADA: 'red', CANCELADA: 'slate' } as const;

export default function NotasPage() {
  const { dados, erro } = useApi<Nota[]>('/notas-fiscais');
  const { dados: clients } = useApi<Client[]>('/clients');
  const [status, setStatus] = useState('');
  const nome = new Map(clients?.map((c) => [c.id, c.razaoSocial]));
  const lista = (dados ?? []).filter((n) => !status || n.status === status);
  const autorizadas = dados?.filter((n) => n.status === 'AUTORIZADA') ?? [];

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo titulo="NF-e e NFC-e" subtitulo="Notas de todos os clientes, transmitidas à SEFAZ pelo gateway. Para emitir, abra o cliente." />
      <Erro msg={erro} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Indicador rotulo="Notas" valor={dados?.length ?? '–'} />
        <Indicador rotulo="Autorizadas" valor={autorizadas.length} tom="green" detalhe={brl(autorizadas.reduce((s, n) => s + Number(n.valorTotal), 0))} />
        <Indicador rotulo="Rejeitadas" valor={dados?.filter((n) => n.status === 'REJEITADA').length ?? 0} tom="red" />
      </div>
      <select className={`${campo} mb-3 max-w-xs`} value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Todos os status</option>
        {Object.keys(TOM).map((s) => (
          <option key={s} value={s}>
            {s.toLowerCase()}
          </option>
        ))}
      </select>
      {!lista.length ? (
        <Vazio>Nenhuma nota encontrada.</Vazio>
      ) : (
        <Tabela cabecalho={['Número', 'Tipo', 'Empresa', 'UF', 'Valor', 'Status', 'Data', '']}>
          {lista.map((n) => (
            <tr key={n.id}>
              <td className="px-4 py-2.5 font-mono text-xs">{n.numero ? `${n.numero}/${n.serie ?? '1'}` : '—'}</td>
              <td className="px-4 py-2.5">{n.tipo}</td>
              <td className="px-4 py-2.5">
                <Link href={`/dashboard/clients/${n.clientId}`} className="text-indigo-700 hover:underline">
                  {nome.get(n.clientId) ?? '—'}
                </Link>
              </td>
              <td className="px-4 py-2.5">{n.uf}</td>
              <td className="px-4 py-2.5 tabular-nums">{brl(n.valorTotal)}</td>
              <td className="px-4 py-2.5" title={n.motivoRejeicao ?? undefined}>
                <Selo tom={TOM[n.status]}>{n.status.toLowerCase()}</Selo>
              </td>
              <td className="px-4 py-2.5">{new Date(n.createdAt).toLocaleDateString('pt-BR')}</td>
              <td className="px-4 py-2.5 text-right">
                {n.danfeUrl && (
                  <a href={n.danfeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">
                    DANFE ↗
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
