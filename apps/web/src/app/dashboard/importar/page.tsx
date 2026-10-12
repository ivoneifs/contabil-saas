'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Botao, Card, Erro, Selo, Tabela, Titulo, campo, formatarDoc } from '@/components/ui';

interface Resultado {
  criados: number;
  existentes: number;
  erros: number;
  resultado: { cnpj: string; status: 'criado' | 'existente' | 'erro'; razaoSocial?: string; erro?: string }[];
}

const LIMITE = 100;

function extrairCnpjs(texto: string) {
  // Aceita qualquer separador (linha, vírgula, ponto e vírgula, colunas de planilha).
  const achados = texto.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g) ?? [];
  return Array.from(new Set(achados.map((c) => c.replace(/\D/g, ''))));
}

export default function ImportarPage() {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [res, setRes] = useState<Resultado | null>(null);
  const cnpjs = extrairCnpjs(texto);

  async function lerArquivo(file: File) {
    const conteudo = await file.text();
    setTexto((t) => `${t}\n${conteudo}`.trim());
  }

  async function importar() {
    setErro(null);
    setRes(null);
    setEnviando(true);
    try {
      const total: Resultado = { criados: 0, existentes: 0, erros: 0, resultado: [] };
      for (let i = 0; i < cnpjs.length; i += LIMITE) {
        const parte = await apiFetch<Resultado>('/clients/importar', {
          method: 'POST',
          body: JSON.stringify({ cnpjs: cnpjs.slice(i, i + LIMITE) }),
        });
        total.criados += parte.criados;
        total.existentes += parte.existentes;
        total.erros += parte.erros;
        total.resultado.push(...parte.resultado);
        setRes({ ...total });
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao importar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl">
      <Titulo
        titulo="Importar clientes em lote"
        subtitulo="Cole os CNPJs da sua carteira (ou envie a planilha em CSV/TXT). O sistema busca os dados na Receita e cadastra todos."
      />

      <Card className="mb-6 border-indigo-200 bg-indigo-50/60">
        <p className="text-sm text-indigo-900">
          <strong>Por que não pelo CRC?</strong> Nenhum órgão publica a lista de clientes de um contador a partir do
          registro no CRC. O CRC só confirma o registro do profissional. A carteira sai do seu próprio controle (planilha,
          sistema antigo, relatório de procurações do e-CAC). Por isso a importação é por lista de CNPJs.
        </p>
      </Card>

      <Erro msg={erro} />

      <Card>
        <textarea
          className={`${campo} h-48 font-mono`}
          placeholder={'00.000.000/0001-91\n33.000.167/0001-01\n…'}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-lg border border-slate-300 px-3.5 py-2 text-sm hover:bg-slate-50">
            Abrir CSV ou TXT
            <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && lerArquivo(e.target.files[0])} />
          </label>
          <span className="text-sm text-slate-500">{cnpjs.length} CNPJ(s) encontrados</span>
          <Botao className="ml-auto" disabled={!cnpjs.length || enviando} onClick={importar}>
            {enviando ? 'Importando…' : `Importar ${cnpjs.length || ''} cliente(s)`}
          </Botao>
        </div>
      </Card>

      {res && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <Selo tom="green">{res.criados} cadastrados</Selo>
            <Selo tom="slate">{res.existentes} já existiam</Selo>
            <Selo tom={res.erros ? 'red' : 'slate'}>{res.erros} com erro</Selo>
            <Link href="/dashboard/clients" className="ml-auto text-sm text-indigo-700 hover:underline">
              Ver clientes →
            </Link>
          </div>
          <Tabela cabecalho={['CNPJ', 'Resultado', 'Empresa / motivo']}>
            {res.resultado.map((r) => (
              <tr key={r.cnpj}>
                <td className="px-4 py-2 font-mono text-xs">{formatarDoc(r.cnpj)}</td>
                <td className="px-4 py-2">
                  <Selo tom={r.status === 'criado' ? 'green' : r.status === 'erro' ? 'red' : 'slate'}>{r.status}</Selo>
                </td>
                <td className="px-4 py-2">{r.razaoSocial ?? r.erro ?? '—'}</td>
              </tr>
            ))}
          </Tabela>
        </div>
      )}
    </main>
  );
}
