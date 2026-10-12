'use client';

import { useEffect, useState } from 'react';
import { Calculator, RotateCcw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { CONFIG_PADRAO, aplicarTema, formatarWhatsapp, type ConfigPlataforma } from '@/lib/tema';
import { lembrarPlataforma } from '@/lib/usar-plataforma';
import { Botao, Campo, Card, Erro, campo, useApi } from '@/components/ui';

const PRESETS: { nome: string; corPrimaria: string; corSecundaria: string; corDestaque: string }[] = [
  { nome: 'Genesis (padrão)', corPrimaria: '#6366f1', corSecundaria: '#8b5cf6', corDestaque: '#c8ff4d' },
  { nome: 'Oceano', corPrimaria: '#0ea5e9', corSecundaria: '#06b6d4', corDestaque: '#facc15' },
  { nome: 'Esmeralda', corPrimaria: '#10b981', corSecundaria: '#14b8a6', corDestaque: '#a3e635' },
  { nome: 'Rubi', corPrimaria: '#e11d48', corSecundaria: '#db2777', corDestaque: '#fbbf24' },
  { nome: 'Âmbar', corPrimaria: '#d97706', corSecundaria: '#ea580c', corDestaque: '#fde047' },
  { nome: 'Grafite', corPrimaria: '#475569', corSecundaria: '#64748b', corDestaque: '#22d3ee' },
];

function SeletorCor({ rotulo, valor, onChange, dica }: { rotulo: string; valor: string; onChange: (v: string) => void; dica: string }) {
  return (
    <Campo rotulo={rotulo} dica={dica}>
      <div className="flex items-center gap-2">
        <input type="color" value={valor} onChange={(e) => onChange(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
        <input className={`${campo} font-mono uppercase`} value={valor} maxLength={7} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)} />
      </div>
    </Campo>
  );
}

export default function Aparencia() {
  const { dados, erro, setDados } = useApi<ConfigPlataforma>('/plataforma/config');
  const [f, setF] = useState<ConfigPlataforma>(CONFIG_PADRAO);
  const [salvando, setSalvando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (dados) setF({ ...CONFIG_PADRAO, ...dados });
  }, [dados]);

  const valido = [f.corPrimaria, f.corSecundaria, f.corDestaque].every((c) => /^#[0-9a-fA-F]{6}$/.test(c));

  // Pré-visualização ao vivo no próprio painel; ao sair sem salvar, volta.
  useEffect(() => {
    if (valido) aplicarTema(f);
  }, [f, valido]);
  useEffect(() => () => {
    if (dados) aplicarTema(dados);
  }, [dados]);

  async function salvar() {
    setFalha(null);
    setOk(false);
    setSalvando(true);
    try {
      const salvo = await apiFetch<ConfigPlataforma>('/admin/plataforma', {
        method: 'PATCH',
        body: JSON.stringify({
          nomeSistema: f.nomeSistema,
          corPrimaria: f.corPrimaria,
          corSecundaria: f.corSecundaria,
          corDestaque: f.corDestaque,
          whatsapp: f.whatsapp.replace(/\D/g, ''),
          precoAVista: Number(f.precoAVista),
          parcelas: Number(f.parcelas),
          valorParcela: Number(f.valorParcela),
        }),
      });
      setDados(salvo);
      lembrarPlataforma(salvo);
      setOk(true);
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Erro msg={falha ?? erro} />
        {ok && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Aparência salva. A landing atualiza em até 1 minuto.</p>}

        <Card>
          <h3 className="font-semibold">Temas prontos</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => (
              <button
                key={p.nome}
                onClick={() => setF({ ...f, ...p })}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm transition hover:border-slate-300 ${
                  f.corPrimaria === p.corPrimaria && f.corDestaque === p.corDestaque ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'
                }`}
              >
                <span className="flex">
                  {[p.corPrimaria, p.corSecundaria, p.corDestaque].map((c) => (
                    <span key={c} className="-ml-1 h-5 w-5 rounded-full ring-2 ring-white first:ml-0" style={{ background: c }} />
                  ))}
                </span>
                {p.nome}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold">Cores personalizadas</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <SeletorCor rotulo="Primária" valor={f.corPrimaria} onChange={(v) => setF({ ...f, corPrimaria: v })} dica="Botões, menu e links" />
            <SeletorCor rotulo="Secundária" valor={f.corSecundaria} onChange={(v) => setF({ ...f, corSecundaria: v })} dica="Gradientes e selos de IA" />
            <SeletorCor rotulo="Destaque" valor={f.corDestaque} onChange={(v) => setF({ ...f, corDestaque: v })} dica="Botões de compra da landing" />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold">Marca e venda</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Campo rotulo="Nome do sistema" dica="Aparece no menu, no login, na landing e no título das páginas.">
                <input className={campo} value={f.nomeSistema} maxLength={60} onChange={(e) => setF({ ...f, nomeSistema: e.target.value })} />
              </Campo>
            </div>
            <Campo rotulo="WhatsApp de vendas" dica={`Com DDI e DDD. Exibido como ${formatarWhatsapp(f.whatsapp)}`}>
              <input className={campo} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value.replace(/\D/g, '') })} />
            </Campo>
            <Campo rotulo="Preço à vista (R$)">
              <input type="number" min={0} className={campo} value={f.precoAVista} onChange={(e) => setF({ ...f, precoAVista: Number(e.target.value) })} />
            </Campo>
            <Campo rotulo="Parcelas">
              <input type="number" min={1} max={24} className={campo} value={f.parcelas} onChange={(e) => setF({ ...f, parcelas: Number(e.target.value) })} />
            </Campo>
            <Campo rotulo="Valor da parcela (R$)" dica="Também é a mensalidade após o 1º ano.">
              <input type="number" min={0} className={campo} value={f.valorParcela} onChange={(e) => setF({ ...f, valorParcela: Number(e.target.value) })} />
            </Campo>
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Botao variante="secundario" className="inline-flex items-center gap-2" onClick={() => setF({ ...f, ...PRESETS[0], nomeSistema: CONFIG_PADRAO.nomeSistema })}>
            <RotateCcw size={15} /> Restaurar padrão
          </Botao>
          <Botao onClick={salvar} disabled={salvando || !valido}>
            {salvando ? 'Salvando…' : 'Salvar aparência'}
          </Botao>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="sticky top-24 space-y-4">
          <p className="text-sm font-medium text-slate-500">Pré-visualização</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex">
              <div className="w-1/3 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 p-3">
                <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                  <Calculator size={14} />
                </div>
                <div className="mb-1.5 h-6 rounded-md bg-gradient-to-r from-indigo-500/25 to-violet-500/10 ring-1 ring-inset ring-white/10" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mb-1.5 h-5 rounded-md bg-white/5" />
                ))}
              </div>
              <div className="flex-1 bg-slate-50 p-4">
                <p className="truncate text-sm font-semibold">{f.nomeSistema}</p>
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[10px] uppercase text-slate-500">A receber</p>
                  <p className="text-lg font-semibold text-indigo-700">R$ 12.480</p>
                </div>
                <button className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white">Botão primário</button>
                <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">IA</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-[#05060a] p-5 text-white">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Landing</p>
            <p className="mt-2 text-xl font-semibold">
              Nenhuma obrigação <span className="text-indigo-300">esquecida.</span>
            </p>
            <span className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: f.corDestaque, color: 'rgb(var(--signal-ink))' }}>
              Contratar · {f.parcelas}x de R$ {f.valorParcela}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
