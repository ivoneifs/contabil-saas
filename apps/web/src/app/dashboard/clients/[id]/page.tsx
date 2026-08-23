'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { FiscalSection } from './fiscal-section';
import { FinanceiroSection } from './financeiro-section';
import { PessoalSection } from './pessoal-section';

interface Client {
  id: string;
  razaoSocial: string;
  cnpjCpf: string;
  uf: string;
}

const TABS = ['Fiscal', 'Financeiro', 'Pessoal'] as const;
type Tab = (typeof TABS)[number];

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const clientId = params.id;
  const [client, setClient] = useState<Client | null>(null);
  const [tab, setTab] = useState<Tab>('Fiscal');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Client>(`/clients/${clientId}`)
      .then(setClient)
      .catch((err) => {
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar cliente.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/dashboard" className="text-sm text-blue-600">
        ← Clientes
      </Link>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {client && (
        <>
          <h1 className="mt-2 text-2xl font-semibold">{client.razaoSocial}</h1>
          <p className="mb-6 text-gray-500">
            {client.cnpjCpf} · {client.uf}
          </p>

          <div className="mb-6 flex gap-4 border-b">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 px-1 pb-2 text-sm ${
                  tab === t ? 'border-black font-medium' : 'border-transparent text-gray-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'Fiscal' && <FiscalSection clientId={client.id} />}
          {tab === 'Financeiro' && <FinanceiroSection clientId={client.id} />}
          {tab === 'Pessoal' && <PessoalSection clientId={client.id} />}
        </>
      )}
    </main>
  );
}
