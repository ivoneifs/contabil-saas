'use client';

import { useEffect, useState, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

interface Client {
  id: string;
  razaoSocial: string;
}

interface Obrigacao {
  id: string;
  titulo: string;
  competencia: string;
  prazo: string;
  status: 'PENDENTE' | 'EM_ANALISE' | 'ENTREGUE';
  clientId: string;
  client: { razaoSocial: string };
}

const COLUNAS: { status: Obrigacao['status']; titulo: string }[] = [
  { status: 'PENDENTE', titulo: 'Pendente' },
  { status: 'EM_ANALISE', titulo: 'Em análise' },
  { status: 'ENTREGUE', titulo: 'Entregue' },
];

export default function ObrigacoesFiscaisPage() {
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [prazo, setPrazo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [obs, cls] = await Promise.all([
        apiFetch<Obrigacao[]>('/obrigacoes-fiscais'),
        apiFetch<Client[]>('/clients'),
      ]);
      setObrigacoes(obs);
      setClients(cls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar obrigações fiscais.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/obrigacoes-fiscais', {
        method: 'POST',
        body: JSON.stringify({ clientId, titulo, competencia, prazo }),
      });
      setTitulo('');
      setCompetencia('');
      setPrazo('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar obrigação fiscal.');
    }
  }

  async function moverPara(id: string, status: Obrigacao['status']) {
    setError(null);
    try {
      await apiFetch(`/obrigacoes-fiscais/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover obrigação.');
    }
  }

  return (
    <main className="mx-auto max-w-5xl">
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Obrigações fiscais</h1>

      <form onSubmit={handleCreate} className="mb-8 flex flex-wrap items-end gap-2">
        <select
          className="rounded border px-3 py-2"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
        >
          <option value="">Cliente...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.razaoSocial}
            </option>
          ))}
        </select>
        <input
          className="min-w-[160px] flex-1 rounded border px-3 py-2"
          placeholder="Título (ex: DAS)"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
        <input
          className="w-32 rounded border px-3 py-2"
          placeholder="Competência (2026-08)"
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          type="date"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          required
        />
        <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
          Adicionar
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {COLUNAS.map((coluna) => (
            <div key={coluna.status} className="rounded border bg-gray-50 p-3">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">{coluna.titulo}</h2>
              <div className="flex flex-col gap-2">
                {obrigacoes
                  .filter((o) => o.status === coluna.status)
                  .map((o) => (
                    <div key={o.id} className="rounded border bg-white p-3 text-sm shadow-sm">
                      <p className="font-medium">{o.titulo}</p>
                      <p className="text-gray-500">{o.client.razaoSocial}</p>
                      <p className="text-gray-500">
                        {o.competencia} · prazo {new Date(o.prazo).toLocaleDateString('pt-BR')}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {coluna.status !== 'PENDENTE' && (
                          <button
                            onClick={() =>
                              moverPara(o.id, coluna.status === 'ENTREGUE' ? 'EM_ANALISE' : 'PENDENTE')
                            }
                            className="text-xs text-gray-500"
                          >
                            ← voltar
                          </button>
                        )}
                        {coluna.status !== 'ENTREGUE' && (
                          <button
                            onClick={() =>
                              moverPara(o.id, coluna.status === 'PENDENTE' ? 'EM_ANALISE' : 'ENTREGUE')
                            }
                            className="text-xs text-blue-600"
                          >
                            avançar →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
