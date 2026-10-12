'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface OrgRow {
  id: string;
  name: string;
  createdAt: string;
  totalClientes: number;
  totalUsuarios: number;
  adminEmail: string | null;
  adminNome: string | null;
}

export default function AdminPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<OrgRow[]>('/admin/organizations')
      .then(setOrgs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar organizações.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-4xl">
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Super Admin · Escritórios na plataforma</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Escritório</th>
              <th className="py-2">Admin</th>
              <th className="py-2">Clientes</th>
              <th className="py-2">Usuários</th>
              <th className="py-2">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="py-2">{o.name}</td>
                <td className="py-2">
                  {o.adminNome ?? '—'} {o.adminEmail && <span className="text-gray-400">({o.adminEmail})</span>}
                </td>
                <td className="py-2">{o.totalClientes}</td>
                <td className="py-2">{o.totalUsuarios}</td>
                <td className="py-2">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
