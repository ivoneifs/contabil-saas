'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, Pencil, Phone, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { usePode } from '@/lib/permissoes';
import ClienteForm, { REGIMES, type Cliente } from '@/components/cliente-form';
import ArquivoFiscal from '@/components/arquivo-fiscal';
import { Botao, Card, Erro, Modal, Selo, formatarDoc } from '@/components/ui';
import { FiscalSection } from './fiscal-section';
import { FinanceiroSection } from './financeiro-section';
import { PessoalSection } from './pessoal-section';
import { AgendaSection } from './agenda-section';
import { DocumentosSection } from './documentos-section';

const ABAS = [
  { id: 'arquivo', titulo: 'Notas fiscais (XML e PDF)', perm: 'fiscal.ver' },
  { id: 'emissao', titulo: 'Emitir NF-e/NFC-e', perm: 'fiscal.ver' },
  { id: 'documentos', titulo: 'Documentos', perm: 'documentos' },
  { id: 'financeiro', titulo: 'Financeiro', perm: 'financeiro' },
  { id: 'pessoal', titulo: 'Pessoal', perm: 'pessoal' },
  { id: 'agenda', titulo: 'Agenda', perm: 'obrigacoes' },
] as const;

type Aba = (typeof ABAS)[number]['id'];

export default function ClienteDetalhePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pode = usePode();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>('arquivo');
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    apiFetch<Cliente>(`/clients/${params.id}`)
      .then(setCliente)
      .catch((err) => setErro(err instanceof Error ? err.message : 'Erro ao carregar cliente.'));
  }, [params.id]);

  const abas = ABAS.filter((a) => pode(a.perm));
  const abaAtual = abas.some((a) => a.id === aba) ? aba : abas[0]?.id;

  async function excluir() {
    try {
      await apiFetch(`/clients/${params.id}`, { method: 'DELETE' });
      router.push('/dashboard/clients');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao excluir.');
      setExcluindo(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      <Link href="/dashboard/clients" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-700">
        <ArrowLeft size={15} /> Clientes
      </Link>
      <Erro msg={erro} />

      {cliente && (
        <>
          <Card className="mb-6 mt-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">{cliente.razaoSocial}</h1>
                {cliente.nomeFantasia && <p className="text-slate-500">{cliente.nomeFantasia}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                  <span className="font-mono">{formatarDoc(cliente.cnpjCpf)}</span>
                  {cliente.regimeTributario ? <Selo tom="indigo">{REGIMES[cliente.regimeTributario]}</Selo> : <Selo tom="amber">Regime não informado</Selo>}
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} /> {cliente.municipio ? `${cliente.municipio}/` : ''}
                    {cliente.uf}
                  </span>
                  {cliente.email && (
                    <a href={`mailto:${cliente.email}`} className="inline-flex items-center gap-1 hover:text-indigo-700">
                      <Mail size={14} /> {cliente.email}
                    </a>
                  )}
                  {cliente.telefone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={14} /> {cliente.telefone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {pode('clientes.gerenciar') && (
                  <Botao variante="secundario" className="inline-flex items-center gap-1.5" onClick={() => setEditando(true)}>
                    <Pencil size={15} /> Editar
                  </Botao>
                )}
                {pode('clientes.excluir') && (
                  <Botao variante="perigo" className="inline-flex items-center gap-1.5" onClick={() => setExcluindo(true)}>
                    <Trash2 size={15} /> Excluir
                  </Botao>
                )}
              </div>
            </div>
          </Card>

          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {abas.map((a) => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${abaAtual === a.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {a.titulo}
              </button>
            ))}
          </div>

          {abaAtual === 'arquivo' && <ArquivoFiscal clienteFixo={cliente.id} />}
          {abaAtual === 'emissao' && <FiscalSection clientId={cliente.id} />}
          {abaAtual === 'documentos' && <DocumentosSection clientId={cliente.id} />}
          {abaAtual === 'financeiro' && <FinanceiroSection clientId={cliente.id} />}
          {abaAtual === 'pessoal' && <PessoalSection clientId={cliente.id} />}
          {abaAtual === 'agenda' && <AgendaSection clientId={cliente.id} />}
          {!abas.length && <p className="text-sm text-slate-500">Você não tem acesso às áreas deste cliente.</p>}

          <Modal aberto={editando} titulo={`Editar ${cliente.razaoSocial}`} onFechar={() => setEditando(false)} largura="max-w-2xl">
            <ClienteForm
              inicial={cliente}
              onSalvo={(c) => {
                setCliente(c);
                setEditando(false);
              }}
            />
          </Modal>

          <Modal aberto={excluindo} titulo="Excluir cliente" onFechar={() => setExcluindo(false)}>
            <p className="text-sm text-slate-600">
              Excluir <b>{cliente.razaoSocial}</b> apaga também documentos, lançamentos, funcionários, obrigações e certificados dele. Os XML e PDF do
              arquivo fiscal continuam guardados, sem vínculo. Não dá para desfazer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Botao variante="secundario" onClick={() => setExcluindo(false)}>
                Cancelar
              </Botao>
              <Botao className="!bg-rose-600 hover:!bg-rose-700" onClick={excluir}>
                Excluir cliente
              </Botao>
            </div>
          </Modal>
        </>
      )}
    </main>
  );
}
