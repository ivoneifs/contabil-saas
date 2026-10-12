'use client';

import { useEffect, useState, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

interface Compromisso {
  id: string;
  titulo: string;
  descricao?: string;
  inicio: string;
  fim: string;
  status: 'AGENDADO' | 'REALIZADO' | 'CANCELADO';
}

const STATUS_COLOR: Record<string, string> = {
  AGENDADO: 'text-blue-600',
  REALIZADO: 'text-green-600',
  CANCELADO: 'text-gray-400',
};

export function AgendaSection({ clientId }: { clientId: string }) {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [titulo, setTitulo] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Compromisso[]>(`/compromissos?clientId=${clientId}`);
      setCompromissos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const inicioDate = new Date(inicio);
      const fimDate = fim ? new Date(fim) : new Date(inicioDate.getTime() + 60 * 60 * 1000);
      await apiFetch('/compromissos', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          titulo,
          inicio: inicioDate.toISOString(),
          fim: fimDate.toISOString(),
        }),
      });
      setTitulo('');
      setInicio('');
      setFim('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar compromisso.');
    }
  }

  async function atualizarStatus(id: string, status: 'REALIZADO' | 'CANCELADO') {
    setError(null);
    try {
      await apiFetch(`/compromissos/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar compromisso.');
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-2">
        <input
          className="min-w-[180px] flex-1 rounded border px-3 py-2"
          placeholder="Título (ex: Reunião de fechamento)"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          type="datetime-local"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          type="datetime-local"
          value={fim}
          onChange={(e) => setFim(e.target.value)}
          placeholder="Fim (opcional)"
        />
        <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
          Agendar
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : compromissos.length === 0 ? (
        <p className="text-gray-500">Nenhum compromisso agendado ainda.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Título</th>
              <th className="py-2">Início</th>
              <th className="py-2">Fim</th>
              <th className="py-2">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {compromissos.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="py-2">{c.titulo}</td>
                <td className="py-2">{new Date(c.inicio).toLocaleString('pt-BR')}</td>
                <td className="py-2">{new Date(c.fim).toLocaleString('pt-BR')}</td>
                <td className={`py-2 font-medium ${STATUS_COLOR[c.status]}`}>{c.status}</td>
                <td className="py-2 text-right">
                  {c.status === 'AGENDADO' && (
                    <div className="flex justify-end gap-3">
                      <button onClick={() => atualizarStatus(c.id, 'REALIZADO')} className="text-sm text-blue-600">
                        Concluir
                      </button>
                      <button onClick={() => atualizarStatus(c.id, 'CANCELADO')} className="text-sm text-red-600">
                        Cancelar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
