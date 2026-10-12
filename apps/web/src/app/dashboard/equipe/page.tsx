'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useEu, usePode } from '@/lib/permissoes';
import { Botao, Campo, Card, Erro, Modal, Selo, Titulo, Vazio, campo, useApi } from '@/components/ui';

type Papel = 'ADMIN' | 'CONTADOR' | 'ASSISTENTE';

interface Membro {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  papel: Papel;
  personalizado: boolean;
  permissoes: string[];
}

interface Catalogo {
  permissoes: { chave: string; grupo: string; nome: string; descricao: string }[];
  padrao: Record<Papel, string[]>;
}

const PAPEIS: Record<Papel, { nome: string; descricao: string }> = {
  ADMIN: { nome: 'Administrador', descricao: 'Acesso total, inclusive equipe e integrações.' },
  CONTADOR: { nome: 'Contador', descricao: 'Quase tudo: só não gerencia a equipe nem as integrações.' },
  ASSISTENTE: { nome: 'Assistente', descricao: 'Rotina: ver clientes, enviar notas, agenda, documentos e IA.' },
};

function FormMembro({ inicial, catalogo, meuId, onSalvo }: { inicial: Membro | null; catalogo: Catalogo; meuId?: string; onSalvo: () => void }) {
  const novo = !inicial;
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [email, setEmail] = useState(inicial?.email ?? '');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<Papel>(inicial?.papel ?? 'ASSISTENTE');
  const [personalizado, setPersonalizado] = useState(inicial?.personalizado ?? false);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set(inicial?.permissoes ?? catalogo.padrao.ASSISTENTE));
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const souEu = inicial?.id === meuId;

  const grupos = useMemo(() => {
    const m = new Map<string, Catalogo['permissoes']>();
    catalogo.permissoes.forEach((p) => m.set(p.grupo, [...(m.get(p.grupo) ?? []), p]));
    return Array.from(m.entries());
  }, [catalogo]);

  // Sem personalizar, as caixas mostram o padrão do papel escolhido.
  const efetivas = papel === 'ADMIN' ? new Set(catalogo.permissoes.map((p) => p.chave)) : personalizado ? marcadas : new Set(catalogo.padrao[papel]);

  function trocarPapel(p: Papel) {
    setPapel(p);
    if (!personalizado) setMarcadas(new Set(catalogo.padrao[p]));
  }

  function alternar(chave: string) {
    if (papel === 'ADMIN') return;
    const base = new Set(efetivas);
    if (base.has(chave)) base.delete(chave);
    else base.add(chave);
    setMarcadas(base);
    setPersonalizado(true);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const permissoes = papel !== 'ADMIN' && personalizado ? Array.from(marcadas) : null;
    try {
      if (novo) {
        await apiFetch('/equipe', { method: 'POST', body: JSON.stringify({ nome, email, senha, papel, ...(permissoes ? { permissoes } : {}) }) });
      } else {
        await apiFetch(`/equipe/${inicial!.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ nome, email, ...(senha ? { senha } : {}), ...(souEu ? {} : { papel }), permissoes }),
        });
      }
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      <Erro msg={erro} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome">
          <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} />
        </Campo>
        <Campo rotulo="E-mail de acesso">
          <input type="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Campo>
        <div className="sm:col-span-2">
          <Campo rotulo={novo ? 'Senha inicial' : 'Nova senha (opcional)'} dica="Mínimo 8 caracteres.">
            <input className={campo} value={senha} onChange={(e) => setSenha(e.target.value)} required={novo} minLength={novo ? 8 : 0} />
          </Campo>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Papel</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(PAPEIS) as Papel[]).map((p) => (
            <button
              type="button"
              key={p}
              disabled={souEu}
              onClick={() => trocarPapel(p)}
              className={`rounded-xl border p-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${papel === p ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <p className="font-semibold">{PAPEIS[p].nome}</p>
              <p className="mt-0.5 text-xs text-slate-500">{PAPEIS[p].descricao}</p>
            </button>
          ))}
        </div>
        {souEu && <p className="mt-1 text-xs text-slate-500">Você não pode mudar o próprio papel.</p>}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">O que pode fazer</p>
          {papel !== 'ADMIN' &&
            (personalizado ? (
              <button
                type="button"
                className="text-xs text-indigo-700 hover:underline"
                onClick={() => {
                  setPersonalizado(false);
                  setMarcadas(new Set(catalogo.padrao[papel]));
                }}
              >
                Voltar ao padrão de {PAPEIS[papel].nome}
              </button>
            ) : (
              <span className="text-xs text-slate-500">Padrão de {PAPEIS[papel].nome}. Marque ou desmarque para personalizar.</span>
            ))}
        </div>
        {papel === 'ADMIN' && <p className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">O administrador tem sempre acesso total.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {grupos.map(([grupo, itens]) => (
            <div key={grupo} className="rounded-xl border border-slate-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{grupo}</p>
              <div className="space-y-2">
                {itens.map((p) => (
                  <label key={p.chave} className={`flex cursor-pointer items-start gap-2.5 ${papel === 'ADMIN' ? 'cursor-not-allowed opacity-70' : ''}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={efetivas.has(p.chave)}
                      disabled={papel === 'ADMIN'}
                      onChange={() => alternar(p.chave)}
                    />
                    <span>
                      <span className="block text-sm font-medium">{p.nome}</span>
                      <span className="block text-xs text-slate-500">{p.descricao}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : novo ? 'Adicionar à equipe' : 'Salvar'}
        </Botao>
      </div>
    </form>
  );
}

export default function EquipePage() {
  const pode = usePode();
  const eu = useEu();
  const { dados: catalogo } = useApi<Catalogo>(pode('equipe') ? '/equipe/catalogo' : null);
  const { dados: membros, erro, recarregar } = useApi<Membro[]>(pode('equipe') ? '/equipe' : null);
  const [form, setForm] = useState<{ aberto: boolean; item: Membro | null }>({ aberto: false, item: null });
  const [falha, setFalha] = useState<string | null>(null);

  const nomes = new Map(catalogo?.permissoes.map((p) => [p.chave, p.nome]));
  const meuId = membros?.find((m) => m.email === eu?.email)?.id;

  async function acao(fn: () => Promise<unknown>) {
    setFalha(null);
    try {
      await fn();
      await recarregar();
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro.');
    }
  }

  if (eu && !pode('equipe')) {
    return <Vazio>Somente o administrador do escritório gerencia a equipe.</Vazio>;
  }

  return (
    <main className="mx-auto max-w-6xl">
      <Titulo
        titulo="Equipe e permissões"
        subtitulo="Cadastre quem trabalha no escritório e marque o que cada pessoa pode fazer."
        acoes={
          <Botao className="inline-flex items-center gap-2" onClick={() => setForm({ aberto: true, item: null })} disabled={!catalogo}>
            <Plus size={16} /> Novo usuário
          </Botao>
        }
      />
      <Erro msg={falha ?? erro} />

      {!membros?.length ? (
        <Vazio>Carregando equipe…</Vazio>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {membros.map((m) => (
            <Card key={m.id} className={m.ativo ? '' : 'opacity-70'}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
                  {m.nome.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {m.nome} {m.id === meuId && <span className="text-xs font-normal text-slate-400">(você)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">{m.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Selo tom={m.papel === 'ADMIN' ? 'violet' : 'indigo'}>
                      {m.papel === 'ADMIN' && <ShieldCheck size={12} className="mr-1" />}
                      {PAPEIS[m.papel].nome}
                    </Selo>
                    {m.personalizado && <Selo tom="amber">Permissões personalizadas</Selo>}
                    {!m.ativo && <Selo tom="red">Bloqueado</Selo>}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                {m.papel === 'ADMIN' ? 'Acesso total.' : m.permissoes.map((p) => nomes.get(p) ?? p).join(' · ') || 'Nenhuma permissão.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <Botao variante="secundario" className="inline-flex items-center gap-1.5" onClick={() => setForm({ aberto: true, item: m })}>
                  <Pencil size={14} /> Editar e permissões
                </Botao>
                {m.id !== meuId && (
                  <>
                    <Botao
                      variante="secundario"
                      className="inline-flex items-center gap-1.5"
                      onClick={() => acao(() => apiFetch(`/equipe/${m.id}`, { method: 'PATCH', body: JSON.stringify({ ativo: !m.ativo }) }))}
                    >
                      {m.ativo ? <Ban size={14} /> : <CheckCircle2 size={14} />} {m.ativo ? 'Bloquear' : 'Desbloquear'}
                    </Botao>
                    <Botao
                      variante="perigo"
                      className="ml-auto inline-flex items-center gap-1.5"
                      onClick={() => window.confirm(`Remover ${m.nome} da equipe?`) && acao(() => apiFetch(`/equipe/${m.id}`, { method: 'DELETE' }))}
                    >
                      <Trash2 size={14} /> Remover
                    </Botao>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal aberto={form.aberto} titulo={form.item ? `Editar ${form.item.nome}` : 'Novo usuário'} onFechar={() => setForm({ aberto: false, item: null })} largura="max-w-3xl">
        {catalogo && (
          <FormMembro
            key={form.item?.id ?? 'novo'}
            inicial={form.item}
            catalogo={catalogo}
            meuId={meuId}
            onSalvo={() => {
              setForm({ aberto: false, item: null });
              recarregar();
            }}
          />
        )}
      </Modal>
    </main>
  );
}
