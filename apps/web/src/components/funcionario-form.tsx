'use client';

import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Botao, Campo, Erro, campo } from '@/components/ui';

export type Vinculo = 'EMPREGADO' | 'APRENDIZ' | 'SOCIO' | 'ESTAGIARIO';

export interface Funcionario {
  id: string;
  clientId: string;
  nome: string;
  cpf: string;
  cargo: string | null;
  salarioBase: string;
  dataAdmissao: string;
  dataDemissao: string | null;
  vinculo: Vinculo;
  matricula: string | null;
  pis: string | null;
  cbo: string | null;
  dataNascimento: string | null;
  dependentesIrrf: number;
  jornadaMensal: number;
  valeTransporte: boolean;
  pensaoAlimenticia: string | null;
  email: string | null;
}

export const VINCULOS: Record<Vinculo, string> = {
  EMPREGADO: 'Empregado (CLT)',
  APRENDIZ: 'Aprendiz',
  SOCIO: 'Sócio (pró-labore)',
  ESTAGIARIO: 'Estagiário',
};

const dia = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

export default function FuncionarioForm({
  inicial,
  clientes,
  clienteFixo,
  vinculoInicial,
  onSalvo,
}: {
  inicial: Funcionario | null;
  clientes: { id: string; razaoSocial: string }[];
  clienteFixo?: string;
  vinculoInicial?: Vinculo;
  onSalvo: () => void;
}) {
  const [f, setF] = useState({
    clientId: inicial?.clientId ?? clienteFixo ?? '',
    nome: inicial?.nome ?? '',
    cpf: inicial?.cpf ?? '',
    cargo: inicial?.cargo ?? '',
    salarioBase: inicial ? String(Number(inicial.salarioBase)) : '',
    dataAdmissao: dia(inicial?.dataAdmissao),
    dataDemissao: dia(inicial?.dataDemissao),
    vinculo: (inicial?.vinculo ?? vinculoInicial ?? 'EMPREGADO') as Vinculo,
    matricula: inicial?.matricula ?? '',
    pis: inicial?.pis ?? '',
    cbo: inicial?.cbo ?? '',
    dataNascimento: dia(inicial?.dataNascimento),
    dependentesIrrf: String(inicial?.dependentesIrrf ?? 0),
    jornadaMensal: String(inicial?.jornadaMensal ?? 220),
    valeTransporte: inicial?.valeTransporte ?? false,
    pensaoAlimenticia: inicial?.pensaoAlimenticia ? String(Number(inicial.pensaoAlimenticia)) : '',
    email: inicial?.email ?? '',
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((v) => ({ ...v, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const socio = f.vinculo === 'SOCIO';

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const corpo: Record<string, unknown> = {
      nome: f.nome.trim(),
      cpf: f.cpf.replace(/\D/g, ''),
      cargo: f.cargo || undefined,
      salarioBase: Number(f.salarioBase),
      dataAdmissao: f.dataAdmissao,
      vinculo: f.vinculo,
      matricula: f.matricula || undefined,
      pis: f.pis || undefined,
      cbo: f.cbo || undefined,
      dataNascimento: f.dataNascimento || undefined,
      dependentesIrrf: Number(f.dependentesIrrf) || 0,
      jornadaMensal: Number(f.jornadaMensal) || 220,
      valeTransporte: f.valeTransporte,
      pensaoAlimenticia: f.pensaoAlimenticia ? Number(f.pensaoAlimenticia) : undefined,
      email: f.email || undefined,
    };
    try {
      if (inicial) {
        await apiFetch(`/funcionarios/${inicial.id}`, { method: 'PATCH', body: JSON.stringify({ ...corpo, dataDemissao: f.dataDemissao }) });
      } else {
        await apiFetch('/funcionarios', { method: 'POST', body: JSON.stringify({ ...corpo, clientId: f.clientId }) });
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
        {!clienteFixo && !inicial && (
          <div className="sm:col-span-2">
            <Campo rotulo="Empresa (cliente)">
              <select className={campo} value={f.clientId} onChange={set('clientId')} required>
                <option value="">Selecione…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razaoSocial}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        )}
        <Campo rotulo="Vínculo">
          <select className={campo} value={f.vinculo} onChange={set('vinculo')}>
            {Object.entries(VINCULOS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Nome completo">
          <input className={campo} value={f.nome} onChange={set('nome')} required minLength={3} />
        </Campo>
        <Campo rotulo="CPF">
          <input className={campo} value={f.cpf} onChange={set('cpf')} required />
        </Campo>
        <Campo rotulo="Data de nascimento">
          <input type="date" className={campo} value={f.dataNascimento} onChange={set('dataNascimento')} />
        </Campo>
        <Campo rotulo={socio ? 'Função' : 'Cargo'}>
          <input className={campo} value={f.cargo} onChange={set('cargo')} />
        </Campo>
        <Campo rotulo="CBO" dica="Código Brasileiro de Ocupações (eSocial).">
          <input className={campo} value={f.cbo} onChange={set('cbo')} />
        </Campo>
        <Campo rotulo={socio ? 'Pró-labore mensal (R$)' : 'Salário base mensal (R$)'}>
          <input type="number" step="0.01" min="0.01" className={campo} value={f.salarioBase} onChange={set('salarioBase')} required />
        </Campo>
        <Campo rotulo={socio ? 'Início do pró-labore' : 'Admissão'}>
          <input type="date" className={campo} value={f.dataAdmissao} onChange={set('dataAdmissao')} required />
        </Campo>
        {!socio && (
          <Campo rotulo="Jornada mensal (horas)" dica="220 para 44 h semanais.">
            <input type="number" min={1} max={240} className={campo} value={f.jornadaMensal} onChange={set('jornadaMensal')} />
          </Campo>
        )}
        <Campo rotulo="Dependentes para IRRF">
          <input type="number" min={0} max={20} className={campo} value={f.dependentesIrrf} onChange={set('dependentesIrrf')} />
        </Campo>
        <Campo rotulo="Pensão alimentícia mensal (R$)">
          <input type="number" step="0.01" min="0" className={campo} value={f.pensaoAlimenticia} onChange={set('pensaoAlimenticia')} />
        </Campo>
        <Campo rotulo="Matrícula">
          <input className={campo} value={f.matricula} onChange={set('matricula')} />
        </Campo>
        <Campo rotulo="PIS/NIS">
          <input className={campo} value={f.pis} onChange={set('pis')} />
        </Campo>
        <Campo rotulo="E-mail (envio do holerite)">
          <input type="email" className={campo} value={f.email} onChange={set('email')} />
        </Campo>
        {inicial && (
          <Campo rotulo="Data de desligamento" dica="Preencher gera o evento S-2299 no eSocial.">
            <input type="date" className={campo} value={f.dataDemissao} onChange={set('dataDemissao')} />
          </Campo>
        )}
        {!socio && (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={f.valeTransporte} onChange={set('valeTransporte')} className="h-4 w-4 rounded border-slate-300" /> Recebe vale-transporte (desconto
            de até 6%)
          </label>
        )}
      </div>
      <div className="flex justify-end">
        <Botao type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : inicial ? 'Salvar' : socio ? 'Cadastrar sócio' : 'Cadastrar funcionário'}
        </Botao>
      </div>
    </form>
  );
}
