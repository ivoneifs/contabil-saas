'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { usePode } from '@/lib/permissoes';
import ClienteForm, { REGIMES, type Cliente } from '@/components/cliente-form';
import { Botao, Erro, Modal, Selo, Tabela, Titulo, Vazio, campo, formatarDoc, useApi } from '@/components/ui';

export default function ClientesPage() {
  const pode = usePode();
  const { dados, erro, recarregar } = useApi<Cliente[]>('/clients');
  const [busca, setBusca] = useState('');
  const [regime, setRegime] = useState('');
  const [form, setForm] = useState<{ aberto: boolean; item: Cliente | null }>({ aberto: false, item: null });
  const [excluindo, setExcluindo] = useState<Cliente | null>(null);
  const [falha, setFalha] = useState<string | null>(null);

  const termo = busca.trim().toLowerCase();
  const digitos = termo.replace(/\D/g, '');
  const lista = (dados ?? []).filter(
    (c) =>
      (!regime || (regime === 'SEM' ? !c.regimeTributario : c.regimeTributario === regime)) &&
      (!termo || c.razaoSocial.toLowerCase().includes(termo) || c.nomeFantasia?.toLowerCase().includes(termo) || (digitos && c.cnpjCpf.includes(digitos))),
  );

  async function excluir() {
    if (!excluindo) return;
    setFalha(null);
    try {
      await apiFetch(`/clients/${excluindo.id}`, { method: 'DELETE' });
      setExcluindo(null);
      recarregar();
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="Clientes"
        subtitulo={`${dados?.length ?? 0} empresas e pessoas atendidas pelo escritório.`}
        acoes={
          pode('clientes.gerenciar') && (
            <>
              <Link href="/dashboard/importar" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Upload size={16} /> Importar em lote
              </Link>
              <Botao className="inline-flex items-center gap-2" onClick={() => setForm({ aberto: true, item: null })}>
                <Plus size={16} /> Novo cliente
              </Botao>
            </>
          )
        }
      />
      <Erro msg={falha ?? erro} />

      <div className="mb-3 flex flex-wrap gap-2">
        <input className={`${campo} max-w-sm`} placeholder="Buscar por nome ou CPF/CNPJ…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className={`${campo} max-w-[220px]`} value={regime} onChange={(e) => setRegime(e.target.value)}>
          <option value="">Todos os regimes</option>
          {Object.entries(REGIMES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
          <option value="SEM">Sem regime informado</option>
        </select>
      </div>

      {!lista.length ? (
        <Vazio>{dados?.length ? 'Nenhum cliente com esse filtro.' : 'Nenhum cliente ainda. Cadastre ou importe a carteira em lote.'}</Vazio>
      ) : (
        <Tabela cabecalho={['Cliente', 'CPF/CNPJ', 'Regime', 'Cidade', 'Contato', '']}>
          {lista.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={`/dashboard/clients/${c.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                  {c.razaoSocial}
                </Link>
                {c.nomeFantasia && <p className="text-xs text-slate-500">{c.nomeFantasia}</p>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{formatarDoc(c.cnpjCpf)}</td>
              <td className="px-4 py-3">{c.regimeTributario ? <Selo tom="indigo">{REGIMES[c.regimeTributario]}</Selo> : <Selo tom="amber">Informar</Selo>}</td>
              <td className="px-4 py-3 text-sm">
                {c.municipio ? `${c.municipio}/` : ''}
                {c.uf}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {c.email && <p className="truncate">{c.email}</p>}
                {c.telefone && <p>{c.telefone}</p>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Link href={`/dashboard/clients/${c.id}`} className="mr-1 rounded-lg px-2 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50">
                  Abrir
                </Link>
                {pode('clientes.gerenciar') && (
                  <button title="Editar" onClick={() => setForm({ aberto: true, item: c })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                    <Pencil size={15} />
                  </button>
                )}
                {pode('clientes.excluir') && (
                  <button title="Excluir" onClick={() => setExcluindo(c)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50">
                    <Trash2 size={15} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Tabela>
      )}

      <Modal aberto={form.aberto} titulo={form.item ? `Editar ${form.item.razaoSocial}` : 'Novo cliente'} onFechar={() => setForm({ aberto: false, item: null })} largura="max-w-2xl">
        <ClienteForm
          key={form.item?.id ?? 'novo'}
          inicial={form.item}
          onSalvo={() => {
            setForm({ aberto: false, item: null });
            recarregar();
          }}
        />
      </Modal>

      <Modal aberto={!!excluindo} titulo="Excluir cliente" onFechar={() => setExcluindo(null)}>
        <p className="text-sm text-slate-600">
          Excluir <b>{excluindo?.razaoSocial}</b> apaga também documentos, lançamentos, funcionários, obrigações e certificados dele. Os XML e PDF do arquivo fiscal continuam guardados, sem vínculo.
          Não dá para desfazer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Botao variante="secundario" onClick={() => setExcluindo(null)}>
            Cancelar
          </Botao>
          <Botao className="!bg-rose-600 hover:!bg-rose-700" onClick={excluir}>
            Excluir cliente
          </Botao>
        </div>
      </Modal>
    </main>
  );
}
