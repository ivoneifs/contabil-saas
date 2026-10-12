'use client';

import { FormEvent, useState } from 'react';
import { Pencil, Plus, Star, Trash2, Zap } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Botao, Campo, Card, Erro, Modal, Selo, Vazio, campo, useApi } from '@/components/ui';

type Provedor = 'ANTHROPIC' | 'OPENAI';

interface Chave {
  id: string;
  provedor: Provedor;
  nome: string;
  final: string;
  modelo: string | null;
  ativa: boolean;
  padrao: boolean;
  ultimoTeste: string | null;
  ultimoErro: string | null;
}

interface Listagem {
  chaves: Chave[];
  emUso: { provedor: Provedor; origem: string } | null;
  modelosPadrao: Record<Provedor, string>;
}

const NOME: Record<Provedor, string> = { ANTHROPIC: 'Anthropic (Claude)', OPENAI: 'OpenAI (GPT)' };
const ONDE: Record<Provedor, string> = {
  ANTHROPIC: 'Crie em console.anthropic.com → API Keys (começa com sk-ant-).',
  OPENAI: 'Crie em platform.openai.com → API keys (começa com sk-).',
};

function FormChave({ inicial, modelosPadrao, onSalvo }: { inicial: Chave | null; modelosPadrao: Record<Provedor, string>; onSalvo: () => void }) {
  const [f, setF] = useState({
    provedor: (inicial?.provedor ?? 'ANTHROPIC') as Provedor,
    nome: inicial?.nome ?? '',
    chave: '',
    modelo: inicial?.modelo ?? '',
    ativa: inicial?.ativa ?? true,
    padrao: inicial?.padrao ?? false,
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const corpo = { ...f, chave: f.chave || undefined, modelo: f.modelo };
      if (inicial) await apiFetch(`/admin/chaves-ia/${inicial.id}`, { method: 'PATCH', body: JSON.stringify(corpo) });
      else await apiFetch('/admin/chaves-ia', { method: 'POST', body: JSON.stringify(corpo) });
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <Erro msg={erro} />
      <div className="grid grid-cols-2 gap-2">
        {(['ANTHROPIC', 'OPENAI'] as Provedor[]).map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => setF({ ...f, provedor: p })}
            className={`rounded-xl border p-3 text-left text-sm transition ${f.provedor === p ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <p className="font-semibold">{NOME[p]}</p>
            <p className="text-xs text-slate-500">Padrão: {modelosPadrao[p]}</p>
          </button>
        ))}
      </div>
      <Campo rotulo="Nome de identificação">
        <input className={campo} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Claude principal" required />
      </Campo>
      <Campo rotulo={inicial ? 'Nova chave (deixe em branco para manter)' : 'Chave de API'} dica={ONDE[f.provedor]}>
        <input type="password" autoComplete="off" className={`${campo} font-mono`} value={f.chave} onChange={(e) => setF({ ...f, chave: e.target.value })} required={!inicial} minLength={inicial ? 0 : 10} />
      </Campo>
      <Campo rotulo="Modelo" dica={`Em branco usa o padrão: ${modelosPadrao[f.provedor]}`}>
        <input className={`${campo} font-mono`} value={f.modelo} onChange={(e) => setF({ ...f, modelo: e.target.value })} placeholder={modelosPadrao[f.provedor]} />
      </Campo>
      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.ativa} onChange={(e) => setF({ ...f, ativa: e.target.checked })} /> Ativa
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.padrao} onChange={(e) => setF({ ...f, padrao: e.target.checked })} /> Usar como padrão do sistema
        </label>
      </div>
      <div className="flex justify-end pt-2">
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : inicial ? 'Salvar' : 'Adicionar chave'}
        </Botao>
      </div>
    </form>
  );
}

export default function ChavesIa() {
  const { dados, erro, recarregar } = useApi<Listagem>('/admin/chaves-ia');
  const [form, setForm] = useState<{ aberto: boolean; item: Chave | null }>({ aberto: false, item: null });
  const [testando, setTestando] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);

  async function acao(fn: () => Promise<unknown>) {
    setFalha(null);
    try {
      await fn();
      await recarregar();
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro.');
    }
  }

  async function testar(id: string) {
    setTestando(id);
    await acao(() => apiFetch(`/admin/chaves-ia/${id}/testar`, { method: 'POST' }));
    setTestando(null);
  }

  return (
    <div>
      <Erro msg={falha ?? erro} />
      <Card className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">IA em uso agora</p>
          <p className="font-semibold">
            {dados?.emUso ? `${NOME[dados.emUso.provedor]} · ${dados.emUso.origem}` : 'Nenhuma chave configurada: assistente, plano da semana e modelos ficam desligados.'}
          </p>
        </div>
        <Botao className="inline-flex items-center gap-2" onClick={() => setForm({ aberto: true, item: null })}>
          <Plus size={16} /> Nova chave
        </Botao>
      </Card>

      {!dados?.chaves.length ? (
        <Vazio>Cadastre uma chave da Anthropic (Claude) ou da OpenAI para ligar a IA de todos os escritórios.</Vazio>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {dados.chaves.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    {c.nome} {c.padrao && <Star size={14} className="fill-amber-400 text-amber-400" />}
                  </p>
                  <p className="text-xs text-slate-500">
                    {NOME[c.provedor]} · <span className="font-mono">••••{c.final}</span>
                  </p>
                </div>
                <Selo tom={c.ativa ? 'green' : 'slate'}>{c.ativa ? 'Ativa' : 'Desativada'}</Selo>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Modelo: <span className="font-mono">{c.modelo || dados.modelosPadrao[c.provedor]}</span>
              </p>
              <p className="mt-1 text-xs">
                {!c.ultimoTeste ? (
                  <span className="text-slate-400">Ainda não testada</span>
                ) : c.ultimoErro ? (
                  <span className="text-rose-600">✕ {c.ultimoErro}</span>
                ) : (
                  <span className="text-emerald-600">✓ Funcionando (testada em {new Date(c.ultimoTeste).toLocaleString('pt-BR')})</span>
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <Botao variante="secundario" className="inline-flex items-center gap-1.5" onClick={() => testar(c.id)} disabled={testando === c.id}>
                  <Zap size={14} /> {testando === c.id ? 'Testando…' : 'Testar'}
                </Botao>
                {!c.padrao && (
                  <Botao variante="secundario" onClick={() => acao(() => apiFetch(`/admin/chaves-ia/${c.id}`, { method: 'PATCH', body: JSON.stringify({ padrao: true, ativa: true }) }))}>
                    Tornar padrão
                  </Botao>
                )}
                <Botao variante="secundario" className="inline-flex items-center gap-1.5" onClick={() => setForm({ aberto: true, item: c })}>
                  <Pencil size={14} /> Editar
                </Botao>
                <Botao
                  variante="perigo"
                  className="ml-auto inline-flex items-center gap-1.5"
                  onClick={() => window.confirm(`Excluir a chave "${c.nome}"?`) && acao(() => apiFetch(`/admin/chaves-ia/${c.id}`, { method: 'DELETE' }))}
                >
                  <Trash2 size={14} /> Excluir
                </Botao>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal aberto={form.aberto} titulo={form.item ? 'Editar chave de IA' : 'Nova chave de IA'} onFechar={() => setForm({ aberto: false, item: null })}>
        {dados && (
          <FormChave
            key={form.item?.id ?? 'nova'}
            inicial={form.item}
            modelosPadrao={dados.modelosPadrao}
            onSalvo={() => {
              setForm({ aberto: false, item: null });
              recarregar();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
