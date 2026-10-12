'use client';

import { FormEvent, useState } from 'react';
import { Ban, CheckCircle2, KeyRound, LogIn, Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { apiFetch, setIsSuperAdmin, setToken } from '@/lib/api';
import { Botao, Campo, Erro, Modal, Selo, Tabela, Vazio, campo, formatarDoc, useApi } from '@/components/ui';

export interface Escritorio {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  plano: string | null;
  acessoAte: string | null;
  observacoes: string | null;
  ativa: boolean;
  createdAt: string;
  totalClientes: number;
  totalUsuarios: number;
  adminEmail: string | null;
  adminNome: string | null;
}

interface Usuario {
  id: string;
  name: string;
  email: string;
  ativo: boolean;
  isSuperAdmin: boolean;
  papel: 'ADMIN' | 'CONTADOR' | 'ASSISTENTE';
}

const PAPEIS = { ADMIN: 'Administrador', CONTADOR: 'Contador', ASSISTENTE: 'Assistente' } as const;

function situacao(e: Escritorio) {
  if (!e.ativa) return { texto: 'Bloqueado', tom: 'red' as const };
  if (e.acessoAte) {
    const dias = Math.ceil((new Date(e.acessoAte).getTime() - Date.now()) / 86400000);
    if (dias < 0) return { texto: 'Vencido', tom: 'red' as const };
    if (dias <= 30) return { texto: `Vence em ${dias}d`, tom: 'amber' as const };
  }
  return { texto: 'Ativo', tom: 'green' as const };
}

const umAno = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

function FormEscritorio({ inicial, onSalvo }: { inicial: Escritorio | null; onSalvo: () => void }) {
  const novo = !inicial;
  const [f, setF] = useState({
    nome: inicial?.nome ?? '',
    cnpj: inicial?.cnpj ?? '',
    telefone: inicial?.telefone ?? '',
    plano: inicial?.plano ?? 'Plano Pro',
    acessoAte: inicial?.acessoAte?.slice(0, 10) ?? (novo ? umAno() : ''),
    observacoes: inicial?.observacoes ?? '',
    adminNome: '',
    adminEmail: '',
    adminSenha: '',
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const base = {
      nome: f.nome,
      cnpj: f.cnpj,
      telefone: f.telefone,
      plano: f.plano,
      acessoAte: f.acessoAte || null,
      observacoes: f.observacoes,
    };
    try {
      if (novo) {
        await apiFetch('/admin/organizations', {
          method: 'POST',
          body: JSON.stringify({ ...base, adminNome: f.adminNome, adminEmail: f.adminEmail, adminSenha: f.adminSenha }),
        });
      } else {
        await apiFetch(`/admin/organizations/${inicial!.id}`, { method: 'PATCH', body: JSON.stringify(base) });
      }
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Campo rotulo="Nome do escritório">
            <input className={campo} value={f.nome} onChange={set('nome')} required minLength={2} />
          </Campo>
        </div>
        <Campo rotulo="CNPJ">
          <input className={campo} value={f.cnpj} onChange={set('cnpj')} placeholder="Opcional" />
        </Campo>
        <Campo rotulo="Telefone / WhatsApp">
          <input className={campo} value={f.telefone} onChange={set('telefone')} placeholder="Opcional" />
        </Campo>
        <Campo rotulo="Plano">
          <input className={campo} value={f.plano} onChange={set('plano')} />
        </Campo>
        <Campo rotulo="Acesso válido até" dica="Em branco = sem vencimento">
          <input type="date" className={campo} value={f.acessoAte} onChange={set('acessoAte')} />
        </Campo>
        <div className="sm:col-span-2">
          <Campo rotulo="Observações internas">
            <textarea className={`${campo} h-20`} value={f.observacoes} onChange={set('observacoes')} placeholder="Forma de pagamento, parcelas pagas, contato…" />
          </Campo>
        </div>
      </div>

      {novo && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <p className="mb-3 text-sm font-semibold text-indigo-900">Usuário administrador do escritório</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome">
              <input className={campo} value={f.adminNome} onChange={set('adminNome')} required minLength={2} />
            </Campo>
            <Campo rotulo="E-mail de acesso">
              <input type="email" className={campo} value={f.adminEmail} onChange={set('adminEmail')} required />
            </Campo>
            <div className="sm:col-span-2">
              <Campo rotulo="Senha inicial" dica="Mínimo 8 caracteres. Envie ao cliente e peça para trocar no primeiro acesso.">
                <input className={campo} value={f.adminSenha} onChange={set('adminSenha')} required minLength={8} />
              </Campo>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : novo ? 'Criar escritório' : 'Salvar alterações'}
        </Botao>
      </div>
    </form>
  );
}

function UsuariosDoEscritorio({ escritorio }: { escritorio: Escritorio }) {
  const { dados, erro, recarregar } = useApi<Usuario[]>(`/admin/organizations/${escritorio.id}/usuarios`);
  const [novo, setNovo] = useState({ nome: '', email: '', senha: '', papel: 'ASSISTENTE' });
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [edicao, setEdicao] = useState({ nome: '', email: '', senha: '', papel: 'ASSISTENTE' });
  const [msg, setMsg] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setFalha(null);
    setMsg(null);
    try {
      await acao();
      setMsg(sucesso);
      await recarregar();
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro.');
    }
  }

  const base = `/admin/organizations/${escritorio.id}/usuarios`;

  return (
    <div className="space-y-5">
      <Erro msg={falha ?? erro} />
      {msg && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {dados?.map((u) =>
          editando?.id === u.id ? (
            <form
              key={u.id}
              className="grid gap-2 bg-slate-50 p-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                executar(
                  () =>
                    apiFetch(`${base}/${u.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({
                        nome: edicao.nome,
                        email: edicao.email,
                        papel: edicao.papel,
                        ...(edicao.senha ? { senha: edicao.senha } : {}),
                      }),
                    }).then(() => setEditando(null)),
                  'Usuário atualizado.',
                );
              }}
            >
              <input className={campo} value={edicao.nome} onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })} required />
              <input type="email" className={campo} value={edicao.email} onChange={(e) => setEdicao({ ...edicao, email: e.target.value })} required />
              <select className={campo} value={edicao.papel} onChange={(e) => setEdicao({ ...edicao, papel: e.target.value })}>
                {Object.entries(PAPEIS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <input className={campo} placeholder="Nova senha (opcional)" minLength={8} value={edicao.senha} onChange={(e) => setEdicao({ ...edicao, senha: e.target.value })} />
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Botao type="button" variante="secundario" onClick={() => setEditando(null)}>
                  Cancelar
                </Botao>
                <Botao type="submit">Salvar</Botao>
              </div>
            </form>
          ) : (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
                {u.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {u.name} {u.isSuperAdmin && <Selo tom="violet">Super Admin</Selo>}
                </p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
              </div>
              <Selo tom="indigo">{PAPEIS[u.papel]}</Selo>
              {!u.ativo && <Selo tom="red">Bloqueado</Selo>}
              <div className="flex gap-1">
                <button
                  title="Editar"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  onClick={() => {
                    setEditando(u);
                    setEdicao({ nome: u.name, email: u.email, senha: '', papel: u.papel });
                  }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  title={u.ativo ? 'Bloquear' : 'Desbloquear'}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  onClick={() =>
                    executar(
                      () => apiFetch(`${base}/${u.id}`, { method: 'PATCH', body: JSON.stringify({ ativo: !u.ativo }) }),
                      u.ativo ? 'Usuário bloqueado.' : 'Usuário desbloqueado.',
                    )
                  }
                >
                  {u.ativo ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                </button>
                <button
                  title="Remover do escritório"
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                  onClick={() => {
                    if (window.confirm(`Remover ${u.name} deste escritório?`)) {
                      executar(() => apiFetch(`${base}/${u.id}`, { method: 'DELETE' }), 'Usuário removido.');
                    }
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ),
        )}
        {dados && !dados.length && <p className="p-4 text-sm text-slate-500">Nenhum usuário.</p>}
      </div>

      <form
        className="rounded-xl border border-dashed border-slate-300 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          executar(
            () => apiFetch(base, { method: 'POST', body: JSON.stringify(novo) }).then(() => setNovo({ nome: '', email: '', senha: '', papel: 'ASSISTENTE' })),
            'Usuário criado.',
          );
        }}
      >
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <UserPlus size={16} /> Incluir usuário
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={campo} placeholder="Nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} required minLength={2} />
          <input type="email" className={campo} placeholder="E-mail" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} required />
          <input className={campo} placeholder="Senha inicial (mín. 8)" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} required minLength={8} />
          <select className={campo} value={novo.papel} onChange={(e) => setNovo({ ...novo, papel: e.target.value })}>
            {Object.entries(PAPEIS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <Botao type="submit">Incluir</Botao>
        </div>
      </form>
    </div>
  );
}

export default function Escritorios({ onMudou }: { onMudou: () => void }) {
  const { dados, erro, recarregar } = useApi<Escritorio[]>('/admin/organizations');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('');
  const [form, setForm] = useState<{ aberto: boolean; item: Escritorio | null }>({ aberto: false, item: null });
  const [usuarios, setUsuarios] = useState<Escritorio | null>(null);
  const [excluindo, setExcluindo] = useState<Escritorio | null>(null);
  const [confirmacao, setConfirmacao] = useState('');
  const [falha, setFalha] = useState<string | null>(null);

  const termo = busca.trim().toLowerCase();
  const lista = (dados ?? []).filter((e) => {
    const s = situacao(e).texto;
    const casaFiltro = !filtro || (filtro === 'ativos' ? s === 'Ativo' || s.startsWith('Vence') : filtro === 'vencendo' ? s.startsWith('Vence') : s === 'Bloqueado' || s === 'Vencido');
    const casaBusca = !termo || [e.nome, e.cnpj, e.adminEmail, e.adminNome].some((v) => v?.toLowerCase().includes(termo));
    return casaFiltro && casaBusca;
  });

  async function atualizar() {
    await recarregar();
    onMudou();
  }

  async function alternar(e: Escritorio) {
    setFalha(null);
    try {
      await apiFetch(`/admin/organizations/${e.id}`, { method: 'PATCH', body: JSON.stringify({ ativa: !e.ativa }) });
      await atualizar();
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro.');
    }
  }

  async function acessar(e: Escritorio) {
    setFalha(null);
    try {
      const r = await apiFetch<{ accessToken: string }>(`/admin/organizations/${e.id}/acessar`, { method: 'POST' });
      // Guarda o token do Super Admin para voltar depois.
      window.localStorage.setItem('tokenSuperAdmin', window.localStorage.getItem('accessToken') ?? '');
      window.localStorage.setItem('suporteEscritorio', e.nome);
      setToken(r.accessToken);
      setIsSuperAdmin(true);
      // Recarrega para o layout ler o novo token (escritório do cliente).
      window.location.href = '/dashboard';
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro ao acessar.');
    }
  }

  async function excluir() {
    if (!excluindo) return;
    setFalha(null);
    try {
      await apiFetch(`/admin/organizations/${excluindo.id}/excluir`, { method: 'POST', body: JSON.stringify({ confirmacao }) });
      setExcluindo(null);
      setConfirmacao('');
      await atualizar();
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  }

  return (
    <div>
      <Erro msg={falha ?? erro} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className={`${campo} max-w-xs`} placeholder="Buscar escritório, CNPJ ou e-mail…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className={`${campo} max-w-[180px]`} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos</option>
          <option value="ativos">Ativos</option>
          <option value="vencendo">Vencendo em 30 dias</option>
          <option value="bloqueados">Bloqueados ou vencidos</option>
        </select>
        <Botao className="ml-auto inline-flex items-center gap-2" onClick={() => setForm({ aberto: true, item: null })}>
          <Plus size={16} /> Novo escritório
        </Botao>
      </div>

      {!lista.length ? (
        <Vazio>{dados?.length ? 'Nenhum escritório com esse filtro.' : 'Nenhum escritório ainda. Crie o primeiro para um cliente que comprou.'}</Vazio>
      ) : (
        <Tabela cabecalho={['Escritório', 'Administrador', 'Plano', 'Acesso até', 'Uso', 'Situação', 'Ações']}>
          {lista.map((e) => {
            const s = situacao(e);
            return (
              <tr key={e.id} className="align-middle">
                <td className="px-4 py-3">
                  <p className="font-medium">{e.nome}</p>
                  <p className="text-xs text-slate-500">{e.cnpj ? formatarDoc(e.cnpj) : 'Sem CNPJ'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm">{e.adminNome ?? '—'}</p>
                  <p className="text-xs text-slate-500">{e.adminEmail}</p>
                </td>
                <td className="px-4 py-3 text-sm">{e.plano ?? '—'}</td>
                <td className="px-4 py-3 text-sm">{e.acessoAte ? new Date(e.acessoAte).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem vencimento'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {e.totalClientes} clientes · {e.totalUsuarios} usuários
                </td>
                <td className="px-4 py-3">
                  <Selo tom={s.tom}>{s.texto}</Selo>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button title="Editar" onClick={() => setForm({ aberto: true, item: e })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                      <Pencil size={15} />
                    </button>
                    <button title="Usuários" onClick={() => setUsuarios(e)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                      <Users size={15} />
                    </button>
                    <button title={e.ativa ? 'Bloquear acesso' : 'Liberar acesso'} onClick={() => alternar(e)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                      {e.ativa ? <Ban size={15} /> : <KeyRound size={15} />}
                    </button>
                    <button title="Entrar no painel (suporte)" onClick={() => acessar(e)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50">
                      <LogIn size={15} />
                    </button>
                    <button title="Excluir" onClick={() => setExcluindo(e)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Tabela>
      )}

      <Modal aberto={form.aberto} titulo={form.item ? `Editar ${form.item.nome}` : 'Novo escritório'} onFechar={() => setForm({ aberto: false, item: null })} largura="max-w-2xl">
        <FormEscritorio
          key={form.item?.id ?? 'novo'}
          inicial={form.item}
          onSalvo={() => {
            setForm({ aberto: false, item: null });
            atualizar();
          }}
        />
      </Modal>

      <Modal aberto={!!usuarios} titulo={`Usuários · ${usuarios?.nome ?? ''}`} onFechar={() => { setUsuarios(null); atualizar(); }} largura="max-w-2xl">
        {usuarios && <UsuariosDoEscritorio escritorio={usuarios} />}
      </Modal>

      <Modal aberto={!!excluindo} titulo="Excluir escritório" onFechar={() => { setExcluindo(null); setConfirmacao(''); }}>
        <p className="text-sm text-slate-600">
          Isto apaga <b>definitivamente</b> o escritório <b>{excluindo?.nome}</b> e todos os dados dele: clientes, notas, documentos,
          certificados e usuários que não pertençam a outro escritório. Não dá para desfazer.
        </p>
        <p className="mt-4 text-sm">Para confirmar, digite o nome do escritório:</p>
        <input className={`${campo} mt-2`} value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} placeholder={excluindo?.nome} />
        <div className="mt-5 flex justify-end gap-2">
          <Botao variante="secundario" onClick={() => setExcluindo(null)}>
            Cancelar
          </Botao>
          <Botao className="!bg-rose-600 hover:!bg-rose-700" disabled={confirmacao.trim() !== excluindo?.nome} onClick={excluir}>
            Excluir definitivamente
          </Botao>
        </div>
      </Modal>
    </div>
  );
}
