'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

interface Documento {
  id: string;
  categoria: 'NOTA_FISCAL' | 'EXTRATO_BANCARIO' | 'OUTRO';
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  createdAt: string;
}

const CATEGORIA_LABEL: Record<string, string> = {
  NOTA_FISCAL: 'Nota fiscal',
  EXTRATO_BANCARIO: 'Extrato bancário',
  OUTRO: 'Outro',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentosSection({ clientId }: { clientId: string }) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [categoria, setCategoria] = useState<'NOTA_FISCAL' | 'EXTRATO_BANCARIO' | 'OUTRO'>('NOTA_FISCAL');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Documento[]>(`/documentos?clientId=${clientId}`);
      setDocumentos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Selecione um arquivo.');
      return;
    }

    setUploading(true);
    try {
      const token = window.localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      formData.append('categoria', categoria);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/documentos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Erro ${res.status}`);
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc: Documento) {
    try {
      const token = window.localStorage.getItem('accessToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/documentos/${doc.id}/conteudo`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) throw new Error('Erro ao baixar arquivo.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nomeArquivo;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar arquivo.');
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await apiFetch(`/documentos/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir documento.');
    }
  }

  return (
    <div>
      <form onSubmit={handleUpload} className="mb-6 flex flex-wrap items-end gap-2">
        <select
          className="rounded border px-3 py-2"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as typeof categoria)}
        >
          <option value="NOTA_FISCAL">Nota fiscal</option>
          <option value="EXTRATO_BANCARIO">Extrato bancário</option>
          <option value="OUTRO">Outro</option>
        </select>
        <input ref={fileInputRef} type="file" className="rounded border px-3 py-2" required />
        <button
          type="submit"
          disabled={uploading}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : documentos.length === 0 ? (
        <p className="text-gray-500">Nenhum documento enviado ainda.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Arquivo</th>
              <th className="py-2">Categoria</th>
              <th className="py-2">Tamanho</th>
              <th className="py-2">Enviado em</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="py-2">{d.nomeArquivo}</td>
                <td className="py-2">{CATEGORIA_LABEL[d.categoria]}</td>
                <td className="py-2">{formatBytes(d.tamanhoBytes)}</td>
                <td className="py-2">{new Date(d.createdAt).toLocaleString('pt-BR')}</td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleDownload(d)} className="text-sm text-blue-600">
                      Baixar
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="text-sm text-red-600">
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
