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

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [uf, setUf] = useState('BA');
  const [municipio, setMunicipio] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<'PJ' | 'PF' | null>(null);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
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

  async function handleCnpjCpfChange(value: string) {
    setCnpjCpf(value);
    const digits = onlyDigits(value);

    if (digits.length === 11) {
      // CPF: não existe API pública/gratuita de consulta por CPF (dado protegido
      // pela LGPD) — só classificamos como Pessoa Física, sem autopreenchimento.
      setTipoPessoa('PF');
      return;
    }

    if (digits.length !== 14) {
      setTipoPessoa(null);
      return;
    }

    setTipoPessoa('PJ');
    setBuscandoCnpj(true);
    setError(null);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error('CNPJ não encontrado na Receita Federal.');
      const data = await res.json();
      setRazaoSocial(data.razao_social ?? '');
      setUf(data.uf ?? uf);
      setMunicipio(data.municipio ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar CNPJ.');
    } finally {
      setBuscandoCnpj(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify({ razaoSocial, cnpjCpf: onlyDigits(cnpjCpf), uf, municipio: municipio || undefined }),
      });
      setRazaoSocial('');
      setCnpjCpf('');
      setMunicipio('');
      setTipoPessoa(null);
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
          <Link href="/dashboard/agenda" className="text-sm text-blue-600">
            Agenda
          </Link>
          <Link href="/dashboard/obrigacoes" className="text-sm text-blue-600">
            Obrigações fiscais
          </Link>
          <Link href="/dashboard/assistente" className="text-sm text-blue-600">
            Assistente
          </Link>
          <Link href="/dashboard/settings" className="text-sm text-blue-600">
            Configurações
          </Link>
          <button onClick={handleLogout} className="text-sm text-blue-600">
            Sair
          </button>
        </div>
      </div>

      <form onSubmit={handleCreate} className="mb-2 flex flex-wrap gap-2">
        <div className="flex flex-col">
          <input
            className="rounded border px-3 py-2"
            placeholder="CPF ou CNPJ"
            value={cnpjCpf}
            onChange={(e) => handleCnpjCpfChange(e.target.value)}
            required
          />
          {tipoPessoa && (
            <span className="mt-1 text-xs text-gray-500">
              {tipoPessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              {buscandoCnpj && ' · consultando Receita Federal...'}
            </span>
          )}
        </div>
        <input
          className="rounded border px-3 py-2"
          placeholder="Razão social / Nome"
          value={razaoSocial}
          onChange={(e) => setRazaoSocial(e.target.value)}
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
      <p className="mb-6 text-xs text-gray-400">
        Para CNPJ, os dados são preenchidos automaticamente pela Receita Federal (via BrasilAPI).
      </p>

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
