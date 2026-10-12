'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiDownload } from '@/lib/api';
import { Botao, Erro, Selo, Tabela, Titulo, Vazio, campo, useApi } from '@/components/ui';

interface Documento {
  id: string;
  clientId: string;
  categoria: string;
  nomeArquivo: string;
  tamanhoBytes: number;
  createdAt: string;
}

interface Client {
  id: string;
  razaoSocial: string;
}

const tamanho = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const rotulo = (c: string) => c.replace(/_/g, ' ').toLowerCase();

export default function DocumentosPage() {
  const { dados, erro } = useApi<Documento[]>('/documentos');
  const { dados: clients } = useApi<Client[]>('/clients');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [erroDl, setErroDl] = useState<string | null>(null);
  const nome = new Map(clients?.map((c) => [c.id, c.razaoSocial]));
  const termo = busca.trim().toLowerCase();
  const categorias = Array.from(new Set(dados?.map((d) => d.categoria) ?? [])).sort();

  const lista = (dados ?? []).filter(
    (d) =>
      (!categoria || d.categoria === categoria) &&
      (!termo || d.nomeArquivo.toLowerCase().includes(termo) || (nome.get(d.clientId) ?? '').toLowerCase().includes(termo)),
  );

  async function baixar(d: Documento) {
    setErroDl(null);
    try {
      await apiDownload(`/documentos/${d.id}/conteudo`, d.nomeArquivo);
    } catch (err) {
      setErroDl(err instanceof Error ? err.message : 'Erro ao baixar.');
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo titulo="Documentos" subtitulo={`${dados?.length ?? 0} arquivos de todos os clientes. Para enviar, abra o cliente.`} />
      <Erro msg={erro ?? erroDl} />
      <div className="mb-3 flex flex-wrap gap-3">
        <input className={`${campo} max-w-sm`} placeholder="Buscar arquivo ou empresa…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className={`${campo} max-w-xs`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {rotulo(c)}
            </option>
          ))}
        </select>
      </div>
      {!lista.length ? (
        <Vazio>Nenhum documento encontrado.</Vazio>
      ) : (
        <Tabela cabecalho={['Arquivo', 'Empresa', 'Categoria', 'Tamanho', 'Enviado em', '']}>
          {lista.map((d) => (
            <tr key={d.id}>
              <td className="max-w-xs truncate px-4 py-2.5 font-medium">{d.nomeArquivo}</td>
              <td className="px-4 py-2.5">
                <Link href={`/dashboard/clients/${d.clientId}`} className="text-indigo-700 hover:underline">
                  {nome.get(d.clientId) ?? '—'}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <Selo>{rotulo(d.categoria)}</Selo>
              </td>
              <td className="px-4 py-2.5 tabular-nums">{tamanho(d.tamanhoBytes)}</td>
              <td className="px-4 py-2.5">{new Date(d.createdAt).toLocaleDateString('pt-BR')}</td>
              <td className="px-4 py-2.5 text-right">
                <Botao variante="secundario" onClick={() => baixar(d)}>
                  Baixar
                </Botao>
              </td>
            </tr>
          ))}
        </Tabela>
      )}
    </main>
  );
}
