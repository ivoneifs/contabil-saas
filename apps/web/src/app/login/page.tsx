'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken } from '@/lib/api';

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
        { accessToken: string } | { requiresOrganizationSelection: true; organizations: OrgOption[] }
      >('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, organizationId: organizationId || undefined }),
      });

      if ('requiresOrganizationSelection' in data) {
        setOrgOptions(data.organizations);
        return;
      }

      setToken(data.accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="rounded border px-3 py-2"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {orgOptions && (
          <select
            className="rounded border px-3 py-2"
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
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <a href="/signup" className="text-sm text-blue-600">
        Criar um escritório novo
      </a>
    </main>
  );
}
