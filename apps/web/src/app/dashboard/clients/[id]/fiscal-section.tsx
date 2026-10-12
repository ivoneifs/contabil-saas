'use client';

import { useEffect, useState, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

interface NotaFiscal {
  id: string;
  tipo: 'NFE' | 'NFCE';
  status: string;
  numero?: string;
  valorTotal: string;
  chaveAcesso?: string;
  motivoRejeicao?: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  RASCUNHO: 'text-gray-500',
  ENVIADA: 'text-blue-600',
  AUTORIZADA: 'text-green-600',
  REJEITADA: 'text-red-600',
  CANCELADA: 'text-gray-400',
};

export function FiscalSection({ clientId }: { clientId: string }) {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [tipo, setTipo] = useState<'NFE' | 'NFCE'>('NFE');
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emitindo, setEmitindo] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<NotaFiscal[]>(`/notas-fiscais?clientId=${clientId}`);
      setNotas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notas fiscais.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleEmitir(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEmitindo(true);
    try {
      await apiFetch('/notas-fiscais', {
        method: 'POST',
        body: JSON.stringify({ clientId, tipo, descricao, valorTotal: Number(valorTotal) }),
      });
      setDescricao('');
      setValorTotal('');
      await load();
    } catch (err) {
      // Erro esperado até o gateway fiscal (Focus NFe) estar configurado com credenciais reais.
      setError(err instanceof Error ? err.message : 'Erro ao emitir nota fiscal.');
    } finally {
      setEmitindo(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleEmitir} className="mb-6 flex flex-wrap items-end gap-2">
        <select
          className="rounded border px-3 py-2"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as 'NFE' | 'NFCE')}
        >
          <option value="NFE">NFe</option>
          <option value="NFCE">NFCe</option>
        </select>
        <input
          className="min-w-[200px] flex-1 rounded border px-3 py-2"
          placeholder="Descrição / natureza da operação"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
        <input
          className="w-32 rounded border px-3 py-2"
          type="number"
          step="0.01"
          placeholder="Valor total"
          value={valorTotal}
          onChange={(e) => setValorTotal(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={emitindo}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {emitindo ? 'Emitindo...' : 'Emitir nota'}
        </button>
      </form>

      {error && (
        <p className="mb-4 text-sm text-red-600">
          {error}
          {error.includes('Gateway fiscal') && (
            <> — configure <code>FOCUS_NFE_TOKEN</code> / <code>FOCUS_NFE_BASE_URL</code> na API.</>
          )}
        </p>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : notas.length === 0 ? (
        <p className="text-gray-500">Nenhuma nota fiscal emitida ainda.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Tipo</th>
              <th className="py-2">Número</th>
              <th className="py-2">Valor</th>
              <th className="py-2">Status</th>
              <th className="py-2">Emitida em</th>
            </tr>
          </thead>
          <tbody>
            {notas.map((n) => (
              <tr key={n.id} className="border-b" title={n.motivoRejeicao ?? undefined}>
                <td className="py-2">{n.tipo}</td>
                <td className="py-2">{n.numero ?? '—'}</td>
                <td className="py-2">R$ {Number(n.valorTotal).toFixed(2)}</td>
                <td className={`py-2 font-medium ${STATUS_COLOR[n.status] ?? ''}`}>{n.status}</td>
                <td className="py-2">{new Date(n.createdAt).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
