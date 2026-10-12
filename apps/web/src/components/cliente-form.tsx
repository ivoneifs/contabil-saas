'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Botao, Campo, Erro, campo } from '@/components/ui';

export interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpjCpf: string;
  regimeTributario: 'MEI' | 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | null;
  uf: string;
  municipio: string | null;
  email: string | null;
  telefone: string | null;
  createdAt?: string;
}

export const REGIMES = {
  MEI: 'MEI',
  SIMPLES_NACIONAL: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
} as const;

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

export default function ClienteForm({ inicial, onSalvo }: { inicial: Cliente | null; onSalvo: (c: Cliente) => void }) {
  const [f, setF] = useState({
    razaoSocial: inicial?.razaoSocial ?? '',
    nomeFantasia: inicial?.nomeFantasia ?? '',
    cnpjCpf: inicial?.cnpjCpf ?? '',
    regimeTributario: inicial?.regimeTributario ?? '',
    uf: inicial?.uf ?? 'BA',
    municipio: inicial?.municipio ?? '',
    email: inicial?.email ?? '',
    telefone: inicial?.telefone ?? '',
  });
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [municipios, setMunicipios] = useState<{ codigoIbge: string; nome: string }[]>([]);

  // Lista oficial do IBGE para sugerir o município (grafia igual à da NF-e).
  useEffect(() => {
    let ativo = true;
    apiFetch<{ codigoIbge: string; nome: string }[]>(`/consultas/municipios/${f.uf}`)
      .then((l) => ativo && setMunicipios(l))
      .catch(() => ativo && setMunicipios([]));
    return () => {
      ativo = false;
    };
  }, [f.uf]);
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  async function preencherPeloCnpj(valor: string) {
    const d = valor.replace(/\D/g, '');
    if (d.length !== 14 || inicial) return;
    setBuscando(true);
    setErro(null);
    try {
      const r = await apiFetch<{
        razao_social: string;
        nome_fantasia: string;
        uf: string;
        municipio: string;
        email: string | null;
        ddd_telefone_1: string;
        opcao_pelo_simples: boolean | null;
        opcao_pelo_mei: boolean | null;
      }>(`/consultas/cnpj/${d}`);
      setF((v) => ({
        ...v,
        razaoSocial: r.razao_social ?? v.razaoSocial,
        nomeFantasia: r.nome_fantasia || v.nomeFantasia,
        uf: r.uf ?? v.uf,
        municipio: r.municipio ?? v.municipio,
        email: r.email?.toLowerCase() || v.email,
        telefone: r.ddd_telefone_1?.trim() || v.telefone,
        regimeTributario: r.opcao_pelo_mei ? 'MEI' : r.opcao_pelo_simples ? 'SIMPLES_NACIONAL' : v.regimeTributario,
      }));
    } catch {
      setErro('Não achei este CNPJ na Receita. Preencha os dados à mão.');
    } finally {
      setBuscando(false);
    }
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const corpo = {
      razaoSocial: f.razaoSocial.trim(),
      cnpjCpf: f.cnpjCpf.replace(/\D/g, ''),
      uf: f.uf,
      nomeFantasia: f.nomeFantasia || undefined,
      regimeTributario: f.regimeTributario || undefined,
      municipio: f.municipio || undefined,
      email: f.email || undefined,
      telefone: f.telefone || undefined,
    };
    try {
      const salvo = inicial
        ? await apiFetch<Cliente>(`/clients/${inicial.id}`, { method: 'PATCH', body: JSON.stringify(corpo) })
        : await apiFetch<Cliente>('/clients', { method: 'POST', body: JSON.stringify(corpo) });
      onSalvo(salvo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
      setErro(/unique|Unique/.test(msg) ? 'Já existe um cliente com este CPF/CNPJ.' : msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <Erro msg={erro} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="CPF ou CNPJ" dica={buscando ? 'Buscando na Receita…' : inicial ? undefined : 'Com CNPJ, os dados vêm da Receita sozinhos.'}>
          <input
            className={campo}
            value={f.cnpjCpf}
            onChange={(e) => {
              set('cnpjCpf')(e);
              preencherPeloCnpj(e.target.value);
            }}
            required
          />
        </Campo>
        <Campo rotulo="Regime tributário" dica="Usado pela agenda inteligente.">
          <select className={campo} value={f.regimeTributario} onChange={set('regimeTributario')}>
            <option value="">Não informado</option>
            {Object.entries(REGIMES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Campo>
        <div className="sm:col-span-2">
          <Campo rotulo="Razão social / nome">
            <input className={campo} value={f.razaoSocial} onChange={set('razaoSocial')} required />
          </Campo>
        </div>
        <Campo rotulo="Nome fantasia">
          <input className={campo} value={f.nomeFantasia} onChange={set('nomeFantasia')} />
        </Campo>
        <div className="grid grid-cols-[90px_1fr] gap-2">
          <Campo rotulo="UF">
            <select className={campo} value={f.uf} onChange={set('uf')}>
              {UFS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Município">
            <input className={campo} value={f.municipio} onChange={set('municipio')} list="municipios-ibge" autoComplete="off" />
            <datalist id="municipios-ibge">
              {municipios.map((m) => (
                <option key={m.codigoIbge} value={m.nome}>
                  IBGE {m.codigoIbge}
                </option>
              ))}
            </datalist>
          </Campo>
        </div>
        <Campo rotulo="E-mail">
          <input type="email" className={campo} value={f.email} onChange={set('email')} />
        </Campo>
        <Campo rotulo="Telefone / WhatsApp">
          <input className={campo} value={f.telefone} onChange={set('telefone')} />
        </Campo>
      </div>
      <div className="flex justify-end">
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : inicial ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Botao>
      </div>
    </form>
  );
}
