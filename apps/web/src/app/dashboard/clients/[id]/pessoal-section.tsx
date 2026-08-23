'use client';

import { useEffect, useState, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  cargo?: string;
  salarioBase: string;
  dataAdmissao: string;
  dataDemissao?: string;
}

export function PessoalSection({ clientId }: { clientId: string }) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cargo, setCargo] = useState('');
  const [salarioBase, setSalarioBase] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Funcionario[]>(`/funcionarios?clientId=${clientId}`);
      setFuncionarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar funcionários.');
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
      await apiFetch('/funcionarios', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          nome,
          cpf,
          cargo: cargo || undefined,
          salarioBase: Number(salarioBase),
          dataAdmissao,
        }),
      });
      setNome('');
      setCpf('');
      setCargo('');
      setSalarioBase('');
      setDataAdmissao('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar funcionário.');
    }
  }

  async function demitir(id: string) {
    setError(null);
    try {
      await apiFetch(`/funcionarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ dataDemissao: new Date().toISOString().slice(0, 10) }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar funcionário.');
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-2">
        <input
          className="min-w-[160px] flex-1 rounded border px-3 py-2"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          className="w-36 rounded border px-3 py-2"
          placeholder="CPF"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          required
        />
        <input
          className="w-36 rounded border px-3 py-2"
          placeholder="Cargo"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
        />
        <input
          className="w-28 rounded border px-3 py-2"
          type="number"
          step="0.01"
          placeholder="Salário base"
          value={salarioBase}
          onChange={(e) => setSalarioBase(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          type="date"
          value={dataAdmissao}
          onChange={(e) => setDataAdmissao(e.target.value)}
          required
        />
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          Adicionar
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : funcionarios.length === 0 ? (
        <p className="text-gray-500">Nenhum funcionário cadastrado ainda.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Nome</th>
              <th className="py-2">Cargo</th>
              <th className="py-2">Salário base</th>
              <th className="py-2">Admissão</th>
              <th className="py-2">Situação</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map((f) => (
              <tr key={f.id} className="border-b">
                <td className="py-2">{f.nome}</td>
                <td className="py-2">{f.cargo ?? '—'}</td>
                <td className="py-2">R$ {Number(f.salarioBase).toFixed(2)}</td>
                <td className="py-2">{new Date(f.dataAdmissao).toLocaleDateString('pt-BR')}</td>
                <td className="py-2">
                  {f.dataDemissao ? (
                    <span className="text-gray-400">
                      Demitido em {new Date(f.dataDemissao).toLocaleDateString('pt-BR')}
                    </span>
                  ) : (
                    <span className="text-green-600">Ativo</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  {!f.dataDemissao && (
                    <button onClick={() => demitir(f.id)} className="text-sm text-blue-600">
                      Demitir
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
