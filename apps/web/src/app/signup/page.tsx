'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ accessToken: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ organizationName, name, email, password }),
      });
      setToken(data.accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Criar escritório</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="rounded border px-3 py-2"
          placeholder="Nome do escritório"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          placeholder="Senha (mín. 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
      </form>
      <a href="/login" className="text-sm text-blue-600">
        Já tenho uma conta
      </a>
    </main>
  );
}
