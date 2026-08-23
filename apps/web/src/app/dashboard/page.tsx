'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, clearToken } from '@/lib/api';

interface Client {
  id: string;
  razaoSocial: string;
  cnpjCpf: string;
  uf: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [uf, setUf] = useState('BA');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadClients() {
    try {
      const data = await apiFetch<Client[]>('/clients');
      setClients(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify({ razaoSocial, cnpjCpf, uf }),
      });
      setRazaoSocial('');
      setCnpjCpf('');
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente.');
    }
  }

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex gap-4">
          <Link href="/dashboard/settings" className="text-sm text-blue-600">
            Configurações
          </Link>
          <button onClick={handleLogout} className="text-sm text-blue-600">
            Sair
          </button>
        </div>
      </div>

      <form onSubmit={handleCreate} className="mb-8 flex flex-wrap gap-2">
        <input
          className="rounded border px-3 py-2"
          placeholder="Razão social"
          value={razaoSocial}
          onChange={(e) => setRazaoSocial(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="CNPJ/CPF"
          value={cnpjCpf}
          onChange={(e) => setCnpjCpf(e.target.value)}
          required
        />
        <input
          className="w-16 rounded border px-3 py-2"
          placeholder="UF"
          value={uf}
          maxLength={2}
          onChange={(e) => setUf(e.target.value.toUpperCase())}
          required
        />
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          Adicionar
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : clients.length === 0 ? (
        <p className="text-gray-500">Nenhum cliente cadastrado ainda.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Razão social</th>
              <th className="py-2">CNPJ/CPF</th>
              <th className="py-2">UF</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="py-2">{c.razaoSocial}</td>
                <td className="py-2">{c.cnpjCpf}</td>
                <td className="py-2">{c.uf}</td>
                <td className="py-2 text-right">
                  <Link href={`/dashboard/clients/${c.id}`} className="text-sm text-blue-600">
                    Abrir →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
