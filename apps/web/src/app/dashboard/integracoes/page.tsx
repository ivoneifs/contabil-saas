'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Zap } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Botao, Card, Erro, Selo, Titulo, useApi } from '@/components/ui';

interface Teste {
  ok: boolean;
  nivel?: 'producao' | 'demonstracao' | 'certificado';
  mensagem: string;
  ms?: number;
  em: string;
}

// Reverifica sozinho quando o último teste tem mais de 6 horas.
const VALIDADE_TESTE = 6 * 60 * 60 * 1000;

function situacao(c: Conector) {
  if (c.teste?.ok) return { texto: '● Funcionando', tom: 'green' as const };
  if (c.teste?.nivel === 'demonstracao') return { texto: '◐ Demonstração', tom: 'indigo' as const };
  if (c.status === 'CONECTADO' && c.teste && !c.teste.ok) return { texto: '✕ Com erro', tom: 'red' as const };
  if (c.status === 'CONECTADO') return { texto: '● Configurado', tom: 'green' as const };
  return { texto: '○ Aguardando', tom: 'amber' as const };
}

const quando = (iso: string) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return min < 1 ? 'agora' : min < 60 ? `há ${min} min` : min < 1440 ? `há ${Math.round(min / 60)} h` : new Date(iso).toLocaleDateString('pt-BR');
};

interface Conector {
  id: string;
  nome: string;
  orgao: string;
  categoria: string;
  descricao: string;
  servicos: string[];
  requisitos: { id: string; rotulo: string; ok: boolean }[];
  etapa: number;
  site: string;
  status: 'CONECTADO' | 'AGUARDANDO_CREDENCIAL';
  teste: Teste | null;
}

const ONDE_CONFIGURAR: Record<string, { href: string; texto: string }> = {
  certificadoEscritorio: { href: '/dashboard/certificados', texto: 'Enviar certificado' },
  certificadoCliente: { href: '/dashboard/certificados', texto: 'Enviar certificado' },
  serpro: { href: '/dashboard/settings', texto: 'Informar chaves' },
  nuvemFiscal: { href: '/dashboard/settings', texto: 'Informar chaves' },
  focusNfe: { href: '/dashboard/settings', texto: 'Informar token' },
  asaas: { href: '/dashboard/settings', texto: 'Informar chave' },
};

export default function IntegracoesPage() {
  const { dados, erro, recarregar } = useApi<Conector[]>('/integracoes/catalogo');
  const [testando, setTestando] = useState<Set<string>>(new Set());
  const [falha, setFalha] = useState<string | null>(null);
  const autoVerificado = useRef(false);
  const categorias = Array.from(new Set(dados?.map((c) => c.categoria) ?? []));
  const funcionando = dados?.filter((c) => c.teste?.ok).length ?? 0;

  async function testar(id: string) {
    setTestando((t) => new Set(t).add(id));
    try {
      await apiFetch(`/integracoes/${id}/testar`, { method: 'POST' });
      await recarregar();
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro ao testar.');
    } finally {
      setTestando((t) => {
        const n = new Set(t);
        n.delete(id);
        return n;
      });
    }
  }

  async function testarTodas() {
    setFalha(null);
    setTestando(new Set(dados?.map((c) => c.id) ?? []));
    try {
      await apiFetch('/integracoes/testar-todas', { method: 'POST' });
      await recarregar();
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro ao verificar.');
    } finally {
      setTestando(new Set());
    }
  }

  // Verificação automática ao abrir, se nunca testou ou o teste está velho.
  useEffect(() => {
    if (!dados || autoVerificado.current) return;
    autoVerificado.current = true;
    const velho = dados.some((c) => !c.teste || Date.now() - new Date(c.teste.em).getTime() > VALIDADE_TESTE);
    if (velho) testarTodas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="Central de integrações"
        subtitulo={`${funcionando} de ${dados?.length ?? 0} funcionando agora. As integrações são verificadas sozinhas ao abrir esta tela e cada uma liga quando a credencial é cadastrada.`}
        acoes={
          <Botao className="inline-flex items-center gap-2" onClick={testarTodas} disabled={testando.size > 0}>
            <RefreshCw size={16} className={testando.size > 1 ? 'animate-spin' : ''} /> {testando.size > 1 ? 'Verificando…' : 'Verificar todas'}
          </Botao>
        }
      />
      <Erro msg={falha ?? erro} />

      {categorias.map((cat) => (
        <section key={cat} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{cat}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dados!
              .filter((c) => c.categoria === cat)
              .map((c) => (
                <Card key={c.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{c.nome}</h3>
                      <p className="text-xs text-slate-500">{c.orgao}</p>
                    </div>
                    <Selo tom={situacao(c).tom}>{situacao(c).texto}</Selo>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{c.descricao}</p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-500">
                    {c.servicos.map((s) => (
                      <li key={s}>• {s}</li>
                    ))}
                  </ul>
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                    {c.requisitos.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className={r.ok ? 'text-emerald-700' : 'text-slate-600'}>
                          {r.ok ? '✓' : '○'} {r.rotulo}
                        </span>
                        {!r.ok && ONDE_CONFIGURAR[r.id] && (
                          <Link href={ONDE_CONFIGURAR[r.id].href} className="text-indigo-700 hover:underline">
                            {ONDE_CONFIGURAR[r.id].texto}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                  <div
                    className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                      testando.has(c.id)
                        ? 'bg-slate-50 text-slate-500'
                        : !c.teste
                          ? 'bg-slate-50 text-slate-400'
                          : c.teste.ok
                            ? 'bg-emerald-50 text-emerald-800'
                            : c.teste.nivel === 'demonstracao'
                              ? 'bg-indigo-50 text-indigo-800'
                              : c.status === 'CONECTADO'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {testando.has(c.id) ? 'Testando conexão…' : c.teste ? `${c.teste.mensagem} · ${quando(c.teste.em)}${c.teste.ms ? ` · ${c.teste.ms} ms` : ''}` : 'Ainda não testada.'}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs">
                    <button onClick={() => testar(c.id)} disabled={testando.has(c.id)} className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:underline disabled:opacity-50">
                      <Zap size={13} /> Testar
                    </button>
                    <span className="text-slate-400">{c.etapa === 1 ? 'Telas no ar' : `Telas na etapa ${c.etapa}`}</span>
                    <a href={c.site} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">
                      Site oficial ↗
                    </a>
                  </div>
                </Card>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
