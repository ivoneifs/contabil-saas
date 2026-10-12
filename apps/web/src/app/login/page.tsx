'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken, setIsSuperAdmin } from '@/lib/api';
import AuthShell from '@/components/auth-shell';

interface OrgOption {
  organizationId: string;
  organizationName: string;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [orgOptions, setOrgOptions] = useState<OrgOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<
        | { accessToken: string; isSuperAdmin: boolean }
        | { requiresOrganizationSelection: true; organizations: OrgOption[] }
      >('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, organizationId: organizationId || undefined }),
      });

      if ('requiresOrganizationSelection' in data) {
        setOrgOptions(data.organizations);
        return;
      }

      setToken(data.accessToken);
      setIsSuperAdmin(data.isSuperAdmin);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Entrar na sua conta</h2>
        <p className="mt-1 text-sm text-slate-500">Acesse o painel do seu escritório.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {orgOptions && (
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            required
          >
            <option value="">Selecione o escritório</option>
            {orgOptions.map((o) => (
              <option key={o.organizationId} value={o.organizationId}>
                {o.organizationName} ({o.role})
              </option>
            ))}
          </select>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:opacity-95 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <a href="/signup" className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
        Criar um escritório novo
      </a>
    </AuthShell>
  );
}
