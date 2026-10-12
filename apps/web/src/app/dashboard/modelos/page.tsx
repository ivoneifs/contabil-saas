'use client';

import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Botao, Card, Erro, Titulo, campo, useApi } from '@/components/ui';

interface Modelo {
  id: string;
  categoria: string;
  titulo: string;
}

interface Client {
  id: string;
  razaoSocial: string;
}

function baixarDoc(titulo: string, texto: string) {
  // HTML simples com extensão .doc abre direto no Word e no LibreOffice.
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const corpo = texto
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
  const html = `<html><head><meta charset="utf-8"><title>${esc(titulo)}</title></head><body style="font-family:Arial;font-size:12pt;line-height:1.5">${corpo}</body></html>`;
  const url = URL.createObjectURL(new Blob(['﻿', html], { type: 'application/msword' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${titulo}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ModelosPage() {
  const { dados: modelos, erro: erroLista } = useApi<Modelo[]>('/modelos');
  const { dados: clients } = useApi<Client[]>('/clients');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [selecionado, setSelecionado] = useState<Modelo | null>(null);
  const [clientId, setClientId] = useState('');
  const [instrucoes, setInstrucoes] = useState('');
  const [texto, setTexto] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const categorias = useMemo(() => Array.from(new Set(modelos?.map((m) => m.categoria) ?? [])), [modelos]);
  const termo = busca.trim().toLowerCase();
  const filtrados = (modelos ?? []).filter(
    (m) => (!categoria || m.categoria === categoria) && (!termo || m.titulo.toLowerCase().includes(termo)),
  );

  async function gerar() {
    if (!selecionado) return;
    setErro(null);
    setGerando(true);
    setTexto('');
    try {
      const r = await apiFetch<{ texto: string }>('/modelos/gerar', {
        method: 'POST',
        body: JSON.stringify({ modeloId: selecionado.id, clientId: clientId || undefined, instrucoes: instrucoes || undefined }),
      });
      setTexto(r.texto);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar o documento.');
    } finally {
      setGerando(false);
    }
  }

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="Modelos com IA"
        subtitulo={`${modelos?.length ?? 0} modelos de documentos para escritórios contábeis. Escolha um modelo e um cliente, e a IA redige o documento completo.`}
      />
      <Erro msg={erro ?? erroLista} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <input className={campo} placeholder="Buscar modelo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className={`${campo} mt-2`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas as categorias ({modelos?.length ?? 0})</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c} ({modelos!.filter((m) => m.categoria === c).length})
              </option>
            ))}
          </select>
          <ul className="mt-3 max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
            {filtrados.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => {
                    setSelecionado(m);
                    setTexto('');
                  }}
                  className={`w-full px-2 py-2 text-left text-sm transition hover:bg-slate-50 ${selecionado?.id === m.id ? 'bg-indigo-50 font-medium text-indigo-800' : ''}`}
                >
                  {m.titulo}
                  {!categoria && <span className="block text-xs font-normal text-slate-400">{m.categoria}</span>}
                </button>
              </li>
            ))}
            {!filtrados.length && <li className="py-4 text-center text-sm text-slate-500">Nenhum modelo encontrado.</li>}
          </ul>
        </Card>

        <Card className="lg:col-span-3">
          {!selecionado ? (
            <p className="py-16 text-center text-sm text-slate-500">← Escolha um modelo na lista.</p>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wide text-slate-500">{selecionado.categoria}</p>
              <h2 className="text-lg font-semibold">{selecionado.titulo}</h2>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <select className={campo} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="">Sem cliente (campos em branco)</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razaoSocial}
                    </option>
                  ))}
                </select>
                <Botao onClick={gerar} disabled={gerando}>
                  {gerando ? 'Redigindo…' : '✦ Gerar com IA'}
                </Botao>
              </div>
              <textarea
                className={`${campo} mt-2 h-20`}
                placeholder="Instruções opcionais (ex.: honorários de R$ 800/mês, vigência de 12 meses, foro de Feira de Santana-BA)"
                value={instrucoes}
                maxLength={2000}
                onChange={(e) => setInstrucoes(e.target.value)}
              />
              {texto && (
                <>
                  <textarea className={`${campo} mt-4 h-[50vh] font-serif leading-relaxed`} value={texto} onChange={(e) => setTexto(e.target.value)} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Botao variante="secundario" onClick={copiar}>
                      {copiado ? 'Copiado ✓' : 'Copiar'}
                    </Botao>
                    <Botao variante="secundario" onClick={() => baixarDoc(selecionado.titulo, texto)}>
                      Baixar .doc (Word)
                    </Botao>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Revise o texto antes de usar: a IA pode errar. Campos entre colchetes precisam ser preenchidos.</p>
                </>
              )}
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
