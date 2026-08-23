'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Compromisso {
  id: string;
  titulo: string;
  inicio: string;
  fim: string;
  status: 'AGENDADO' | 'REALIZADO' | 'CANCELADO';
  clientId: string;
  client: { razaoSocial: string };
}

const STATUS_COLOR: Record<string, string> = {
  AGENDADO: 'text-blue-600',
  REALIZADO: 'text-green-600',
  CANCELADO: 'text-gray-400',
};

export default function AgendaGeralPage() {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Compromisso[]>('/compromissos')
      .then(setCompromissos)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar agenda.'))
      .finally(() => setLoading(false));
  }, []);

  const futuros = compromissos.filter((c) => new Date(c.fim) >= new Date() && c.status === 'AGENDADO');
  const passados = compromissos.filter((c) => new Date(c.fim) < new Date() || c.status !== 'AGENDADO');

  function renderTable(lista: Compromisso[]) {
    if (lista.length === 0) return <p className="text-gray-500">Nada aqui.</p>;
    return (
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Cliente</th>
            <th className="py-2">Título</th>
            <th className="py-2">Início</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2">
                <Link href={`/dashboard/clients/${c.clientId}`} className="text-blue-600">
                  {c.client.razaoSocial}
                </Link>
              </td>
              <td className="py-2">{c.titulo}</td>
              <td className="py-2">{new Date(c.inicio).toLocaleString('pt-BR')}</td>
              <td className={`py-2 font-medium ${STATUS_COLOR[c.status]}`}>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/dashboard" className="text-sm text-blue-600">
        ← Clientes
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Agenda geral</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <h2 className="mb-3 text-lg font-medium">Próximos compromissos</h2>
          <div className="mb-8">{renderTable(futuros)}</div>

          <h2 className="mb-3 text-lg font-medium">Histórico</h2>
          {renderTable(passados)}
        </>
      )}
    </main>
  );
}
