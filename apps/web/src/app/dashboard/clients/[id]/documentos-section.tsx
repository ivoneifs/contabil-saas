'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

type Categoria =
  | 'NFE_ENTRADA'
  | 'NFE_SAIDA'
  | 'NFSE'
  | 'NFCE'
  | 'CTE'
  | 'XML_NOTA_FISCAL'
  | 'REDUCAO_Z_LEITURA_X'
  | 'SPED'
  | 'EXTRATO_BANCARIO'
  | 'EXTRATO_APLICACAO'
  | 'EXTRATO_CARTAO'
  | 'COMPROVANTE_PAGAMENTO'
  | 'CONTRATO_EMPRESTIMO'
  | 'DUPLICATA_BOLETO'
  | 'CONTROLE_RECEBIMENTO'
  | 'FATURA_ENERGIA'
  | 'FATURA_AGUA'
  | 'FATURA_TELEFONIA_INTERNET'
  | 'RECIBO_ALUGUEL'
  | 'COMPROVANTE_CONDOMINIO_IPTU'
  | 'FOLHA_PAGAMENTO'
  | 'GUIA_FGTS'
  | 'COMPROVANTE_PROLABORE'
  | 'RECIBO_FERIAS_RESCISAO'
  | 'RECIBO_AUTONOMO_RPA'
  | 'GUIA_DAS'
  | 'GUIA_DARF'
  | 'GUIA_ISS_ICMS'
  | 'CONTRATO_SOCIAL'
  | 'OUTRO';

interface Documento {
  id: string;
  categoria: Categoria;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  createdAt: string;
}

const CATEGORIA_LABEL: Record<Categoria, string> = {
  NFE_ENTRADA: 'NF-e de entrada',
  NFE_SAIDA: 'NF-e de saída',
  NFSE: 'NFS-e (serviço)',
  NFCE: 'NFC-e (consumidor)',
  CTE: 'CT-e (transporte)',
  XML_NOTA_FISCAL: 'XML da nota fiscal',
  REDUCAO_Z_LEITURA_X: 'Redução Z / Leitura X',
  SPED: 'Arquivo SPED',
  EXTRATO_BANCARIO: 'Extrato bancário',
  EXTRATO_APLICACAO: 'Extrato de aplicação',
  EXTRATO_CARTAO: 'Extrato de cartão',
  COMPROVANTE_PAGAMENTO: 'Comprovante de pagamento',
  CONTRATO_EMPRESTIMO: 'Contrato de empréstimo',
  DUPLICATA_BOLETO: 'Duplicata/boleto pago',
  CONTROLE_RECEBIMENTO: 'Controle de recebimento',
  FATURA_ENERGIA: 'Fatura de energia',
  FATURA_AGUA: 'Fatura de água',
  FATURA_TELEFONIA_INTERNET: 'Fatura de telefonia/internet',
  RECIBO_ALUGUEL: 'Recibo de aluguel',
  COMPROVANTE_CONDOMINIO_IPTU: 'Condomínio/IPTU',
  FOLHA_PAGAMENTO: 'Folha de pagamento',
  GUIA_FGTS: 'Guia do FGTS',
  COMPROVANTE_PROLABORE: 'Comprovante de pró-labore',
  RECIBO_FERIAS_RESCISAO: 'Recibo de férias/rescisão',
  RECIBO_AUTONOMO_RPA: 'RPA (autônomo)',
  GUIA_DAS: 'Guia DAS',
  GUIA_DARF: 'Guia DARF',
  GUIA_ISS_ICMS: 'Guia ISS/ICMS',
  CONTRATO_SOCIAL: 'Contrato social',
  OUTRO: 'Outro',
};

const CATEGORIA_GRUPOS: { grupo: string; categorias: Categoria[] }[] = [
  {
    grupo: 'Fiscais e de Operações',
    categorias: ['NFE_ENTRADA', 'NFE_SAIDA', 'NFSE', 'NFCE', 'CTE', 'XML_NOTA_FISCAL', 'REDUCAO_Z_LEITURA_X', 'SPED'],
  },
  {
    grupo: 'Financeiros e Bancários',
    categorias: [
      'EXTRATO_BANCARIO',
      'EXTRATO_APLICACAO',
      'EXTRATO_CARTAO',
      'COMPROVANTE_PAGAMENTO',
      'CONTRATO_EMPRESTIMO',
      'DUPLICATA_BOLETO',
      'CONTROLE_RECEBIMENTO',
    ],
  },
  {
    grupo: 'Despesas e Custos',
    categorias: ['FATURA_ENERGIA', 'FATURA_AGUA', 'FATURA_TELEFONIA_INTERNET', 'RECIBO_ALUGUEL', 'COMPROVANTE_CONDOMINIO_IPTU'],
  },
  {
    grupo: 'Trabalhistas e Previdenciários',
    categorias: ['FOLHA_PAGAMENTO', 'GUIA_FGTS', 'COMPROVANTE_PROLABORE', 'RECIBO_FERIAS_RESCISAO', 'RECIBO_AUTONOMO_RPA'],
  },
  {
    grupo: 'Tributários e Societários',
    categorias: ['GUIA_DAS', 'GUIA_DARF', 'GUIA_ISS_ICMS', 'CONTRATO_SOCIAL'],
  },
  { grupo: 'Outros', categorias: ['OUTRO'] },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentosSection({ clientId }: { clientId: string }) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [categoria, setCategoria] = useState<Categoria>('NFE_ENTRADA');
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
          onChange={(e) => setCategoria(e.target.value as Categoria)}
        >
          {CATEGORIA_GRUPOS.map((g) => (
            <optgroup key={g.grupo} label={g.grupo}>
              {g.categorias.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABEL[c]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <input ref={fileInputRef} type="file" className="rounded border px-3 py-2" required />
        <button
          type="submit"
          disabled={uploading}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
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
