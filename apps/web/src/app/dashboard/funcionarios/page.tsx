'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { usePode } from '@/lib/permissoes';
import FuncionarioForm, { VINCULOS, type Funcionario } from '@/components/funcionario-form';
import { Botao, Erro, Indicador, Modal, Selo, Tabela, Titulo, Vazio, brl, campo, dataBR, formatarDoc, useApi } from '@/components/ui';

interface Client {
  id: string;
  razaoSocial: string;
}

export default function FuncionariosPage() {
  const pode = usePode();
  const { dados, erro, recarregar } = useApi<Funcionario[]>('/funcionarios');
  const { dados: clients } = useApi<Client[]>('/clients');
  const [busca, setBusca] = useState('');
  const [cliente, setCliente] = useState('');
  const [vinculo, setVinculo] = useState('');
  const [mostrarDesligados, setMostrarDesligados] = useState(false);
  const [form, setForm] = useState<{ aberto: boolean; item: Funcionario | null }>({ aberto: false, item: null });
  const nome = new Map(clients?.map((c) => [c.id, c.razaoSocial]));
  const termo = busca.trim().toLowerCase();

  const lista = (dados ?? []).filter(
    (f) =>
      (mostrarDesligados || !f.dataDemissao) &&
      (!cliente || f.clientId === cliente) &&
      (!vinculo || f.vinculo === vinculo) &&
      (!termo || f.nome.toLowerCase().includes(termo) || f.cpf.includes(termo.replace(/\D/g, '') || '#') || (nome.get(f.clientId) ?? '').toLowerCase().includes(termo)),
  );
  const ativos = dados?.filter((f) => !f.dataDemissao) ?? [];
  const folha = ativos.reduce((s, f) => s + Number(f.salarioBase), 0);

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="Funcionários e sócios"
        subtitulo="Cadastro usado pela folha, férias, rescisões e eSocial."
        acoes={
          pode('pessoal') && (
            <Botao className="inline-flex items-center gap-2" onClick={() => setForm({ aberto: true, item: null })} disabled={!clients?.length}>
              <Plus size={16} /> Novo cadastro
            </Botao>
          )
        }
      />
      <Erro msg={erro} />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Indicador rotulo="Ativos" valor={ativos.length} />
        <Indicador rotulo="Empregados" valor={ativos.filter((f) => f.vinculo === 'EMPREGADO' || f.vinculo === 'APRENDIZ').length} />
        <Indicador rotulo="Sócios com pró-labore" valor={ativos.filter((f) => f.vinculo === 'SOCIO').length} />
        <Indicador rotulo="Salários base" valor={brl(folha)} tom="indigo" />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className={`${campo} max-w-xs`} placeholder="Buscar nome, CPF ou empresa…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className={`${campo} max-w-[240px]`} value={cliente} onChange={(e) => setCliente(e.target.value)}>
          <option value="">Todas as empresas</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.razaoSocial}
            </option>
          ))}
        </select>
        <select className={`${campo} max-w-[200px]`} value={vinculo} onChange={(e) => setVinculo(e.target.value)}>
          <option value="">Todos os vínculos</option>
          {Object.entries(VINCULOS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={mostrarDesligados} onChange={(e) => setMostrarDesligados(e.target.checked)} /> Mostrar desligados
        </label>
      </div>
      {!lista.length ? (
        <Vazio>{dados?.length ? 'Ninguém com esse filtro.' : 'Nenhum funcionário ainda. Cadastre o primeiro.'}</Vazio>
      ) : (
        <Tabela cabecalho={['Nome', 'CPF', 'Empresa', 'Vínculo', 'Cargo', 'Salário', 'Admissão', 'Situação', '']}>
          {lista.map((f) => (
            <tr key={f.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-medium">{f.nome}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{formatarDoc(f.cpf)}</td>
              <td className="px-4 py-2.5">
                <Link href={`/dashboard/clients/${f.clientId}`} className="text-indigo-700 hover:underline">
                  {nome.get(f.clientId) ?? '—'}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <Selo tom={f.vinculo === 'SOCIO' ? 'violet' : 'slate'}>{VINCULOS[f.vinculo]}</Selo>
              </td>
              <td className="px-4 py-2.5">{f.cargo ?? '—'}</td>
              <td className="px-4 py-2.5 tabular-nums">{brl(f.salarioBase)}</td>
              <td className="px-4 py-2.5">{dataBR(f.dataAdmissao)}</td>
              <td className="px-4 py-2.5">{f.dataDemissao ? <Selo tom="slate">Desligado em {dataBR(f.dataDemissao)}</Selo> : <Selo tom="green">Ativo</Selo>}</td>
              <td className="px-4 py-2.5 text-right">
                {pode('pessoal') && (
                  <button title="Editar" onClick={() => setForm({ aberto: true, item: f })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                    <Pencil size={15} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Tabela>
      )}

      <Modal aberto={form.aberto} titulo={form.item ? `Editar ${form.item.nome}` : 'Novo funcionário ou sócio'} onFechar={() => setForm({ aberto: false, item: null })} largura="max-w-3xl">
        <FuncionarioForm
          key={form.item?.id ?? 'novo'}
          inicial={form.item}
          clientes={clients ?? []}
          clienteFixo={cliente || undefined}
          onSalvo={() => {
            setForm({ aberto: false, item: null });
            recarregar();
          }}
        />
      </Modal>
    </main>
  );
}
