'use client';

import { useEffect, useState, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

interface Lancamento {
  id: string;
  tipo: 'A_PAGAR' | 'A_RECEBER';
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO';
  descricao: string;
  valor: string;
  vencimento: string;
  pagoEm?: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDENTE: 'text-yellow-600',
  PAGO: 'text-green-600',
  VENCIDO: 'text-red-600',
  CANCELADO: 'text-gray-400',
};

export function FinanceiroSection({ clientId }: { clientId: string }) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [tipo, setTipo] = useState<'A_PAGAR' | 'A_RECEBER'>('A_RECEBER');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Lancamento[]>(`/lancamentos?clientId=${clientId}`);
      setLancamentos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lançamentos.');
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
      await apiFetch('/lancamentos', {
        method: 'POST',
        body: JSON.stringify({ clientId, tipo, descricao, valor: Number(valor), vencimento }),
      });
      setDescricao('');
      setValor('');
      setVencimento('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar lançamento.');
    }
  }

  async function marcarComoPago(id: string) {
    setError(null);
    try {
      await apiFetch(`/lancamentos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PAGO' }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lançamento.');
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-2">
        <select
          className="rounded border px-3 py-2"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as 'A_PAGAR' | 'A_RECEBER')}
        >
          <option value="A_RECEBER">A receber</option>
          <option value="A_PAGAR">A pagar</option>
        </select>
        <input
          className="min-w-[180px] flex-1 rounded border px-3 py-2"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
        <input
          className="w-28 rounded border px-3 py-2"
          type="number"
          step="0.01"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          type="date"
          value={vencimento}
          onChange={(e) => setVencimento(e.target.value)}
          required
        />
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          Adicionar
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : lancamentos.length === 0 ? (
        <p className="text-gray-500">Nenhum lançamento cadastrado ainda.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Tipo</th>
              <th className="py-2">Descrição</th>
              <th className="py-2">Valor</th>
              <th className="py-2">Vencimento</th>
              <th className="py-2">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr key={l.id} className="border-b">
                <td className="py-2">{l.tipo === 'A_RECEBER' ? 'A receber' : 'A pagar'}</td>
                <td className="py-2">{l.descricao}</td>
                <td className="py-2">R$ {Number(l.valor).toFixed(2)}</td>
                <td className="py-2">{new Date(l.vencimento).toLocaleDateString('pt-BR')}</td>
                <td className={`py-2 font-medium ${STATUS_COLOR[l.status]}`}>{l.status}</td>
                <td className="py-2 text-right">
                  {l.status === 'PENDENTE' && (
                    <button onClick={() => marcarComoPago(l.id)} className="text-sm text-blue-600">
                      Marcar como pago
                    </button>
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
