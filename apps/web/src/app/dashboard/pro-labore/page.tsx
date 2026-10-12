'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { usePode } from '@/lib/permissoes';
import FuncionarioForm, { type Funcionario } from '@/components/funcionario-form';
import { Botao, Card, Erro, Indicador, Modal, Tabela, Titulo, Vazio, brl, formatarDoc, useApi } from '@/components/ui';

// Estimativa mensal com as regras do motor: INSS 11% (contribuinte
// individual, até o teto) e IRRF com a redução da Lei 15.270.
const TETO = 8475.55;

export default function ProLaborePage() {
  const pode = usePode();
  const { dados, erro, recarregar } = useApi<Funcionario[]>('/funcionarios');
  const { dados: clients } = useApi<{ id: string; razaoSocial: string; regimeTributario: string | null }[]>('/clients');
  const [form, setForm] = useState<{ aberto: boolean; item: Funcionario | null }>({ aberto: false, item: null });
  const socios = (dados ?? []).filter((f) => f.vinculo === 'SOCIO' && !f.dataDemissao);
  const cliente = new Map(clients?.map((c) => [c.id, c]));
  const total = socios.reduce((s, f) => s + Number(f.salarioBase), 0);
  const inss = socios.reduce((s, f) => s + Math.min(Number(f.salarioBase), TETO) * 0.11, 0);

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="Pró-labore"
        subtitulo="Sócios com retirada mensal. Entram na folha do cliente com INSS de 11% (contribuinte individual), IRRF e sem FGTS."
        acoes={
          pode('pessoal') && (
            <Botao className="inline-flex items-center gap-2" onClick={() => setForm({ aberto: true, item: null })} disabled={!clients?.length}>
              <Plus size={16} /> Novo sócio
            </Botao>
          )
        }
      />
      <Erro msg={erro} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Indicador rotulo="Sócios com pró-labore" valor={socios.length} />
        <Indicador rotulo="Pró-labore mensal" valor={brl(total)} tom="indigo" />
        <Indicador rotulo="INSS retido (11%)" valor={brl(inss)} tom="amber" detalhe="Lucro Presumido/Real: + 20% patronal" />
      </div>
      {!socios.length ? (
        <Vazio>Nenhum sócio com pró-labore cadastrado.</Vazio>
      ) : (
        <Tabela cabecalho={['Sócio', 'CPF', 'Empresa', 'Regime', 'Pró-labore', 'INSS 11%', 'Desde', '']}>
          {socios.map((f) => {
            const c = cliente.get(f.clientId);
            return (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium">{f.nome}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{formatarDoc(f.cpf)}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/dashboard/clients/${f.clientId}`} className="text-indigo-700 hover:underline">
                    {c?.razaoSocial ?? '—'}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-xs">{c?.regimeTributario?.replace('_', ' ').toLowerCase() ?? 'não informado'}</td>
                <td className="px-4 py-2.5 tabular-nums">{brl(f.salarioBase)}</td>
                <td className="px-4 py-2.5 tabular-nums">{brl(Math.min(Number(f.salarioBase), TETO) * 0.11)}</td>
                <td className="px-4 py-2.5">{new Date(f.dataAdmissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td className="px-4 py-2.5 text-right">
                  {pode('pessoal') && (
                    <button title="Editar" onClick={() => setForm({ aberto: true, item: f })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                      <Pencil size={15} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </Tabela>
      )}
      <Card className="mt-4">
        <p className="text-xs text-slate-500">
          O recibo de pró-labore sai junto com os holerites da folha do cliente. Distribuição de lucros não entra aqui: é isenta e não tem INSS. Use o modelo
          &quot;Ata de distribuição de lucros&quot; em Modelos com IA.
        </p>
      </Card>
      <Modal aberto={form.aberto} titulo={form.item ? `Editar ${form.item.nome}` : 'Novo sócio com pró-labore'} onFechar={() => setForm({ aberto: false, item: null })} largura="max-w-3xl">
        <FuncionarioForm
          key={form.item?.id ?? 'novo'}
          inicial={form.item}
          clientes={clients ?? []}
          vinculoInicial="SOCIO"
          onSalvo={() => {
            setForm({ aberto: false, item: null });
            recarregar();
          }}
        />
      </Modal>
    </main>
  );
}
