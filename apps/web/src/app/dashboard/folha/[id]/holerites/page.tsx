'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Botao, Erro, brl, competenciaBR, formatarDoc } from '@/components/ui';
import type { FolhaDetalhe, ItemFolha } from '../page';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const reais = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Holerite({ folha, item }: { folha: FolhaDetalhe; item: ItemFolha }) {
  const r = item.resultado;
  const proventos = r.rubricas.reduce((s, x) => s + (x.provento ?? 0), 0);
  const descontos = r.rubricas.reduce((s, x) => s + (x.desconto ?? 0), 0);
  const [ano, mes] = folha.competencia.split('-').map(Number);
  const linhasVazias = Math.max(0, 12 - r.rubricas.length);
  return (
    <section className="holerite mx-auto mb-8 max-w-[800px] break-after-page border border-slate-400 bg-white p-5 text-[12px] text-black print:mb-0 print:border-slate-600">
      <div className="flex items-start justify-between border-b border-slate-400 pb-2">
        <div>
          <p className="text-[14px] font-bold uppercase">{folha.client.razaoSocial}</p>
          <p>CNPJ {formatarDoc(folha.client.cnpjCpf)}{folha.client.municipio ? ` · ${folha.client.municipio}/${folha.client.uf}` : ''}</p>
        </div>
        <div className="text-right">
          <p className="font-bold uppercase">{item.funcionario.vinculo === 'SOCIO' ? 'Recibo de pró-labore' : 'Recibo de pagamento de salário'}</p>
          <p>
            Referência: {MESES[mes - 1]}/{ano}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-x-3 border-b border-slate-400 py-2">
        <p className="col-span-2">
          <span className="text-[10px] uppercase text-slate-600">Nome</span>
          <br />
          <b>{item.funcionario.nome}</b>
        </p>
        <p>
          <span className="text-[10px] uppercase text-slate-600">CPF</span>
          <br />
          {formatarDoc(item.funcionario.cpf)}
        </p>
        <p>
          <span className="text-[10px] uppercase text-slate-600">Admissão</span>
          <br />
          {new Date(item.funcionario.dataAdmissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
        </p>
        <p className="col-span-2">
          <span className="text-[10px] uppercase text-slate-600">Cargo</span>
          <br />
          {item.funcionario.cargo ?? '—'}
        </p>
        <p>
          <span className="text-[10px] uppercase text-slate-600">CBO</span>
          <br />
          {item.funcionario.cbo ?? '—'}
        </p>
        <p>
          <span className="text-[10px] uppercase text-slate-600">Matrícula</span>
          <br />
          {item.funcionario.matricula ?? '—'}
        </p>
      </div>
      <table className="w-full border-b border-slate-400">
        <thead>
          <tr className="border-b border-slate-400 text-[10px] uppercase text-slate-600">
            <th className="py-1 text-left">Cód.</th>
            <th className="py-1 text-left">Descrição</th>
            <th className="py-1 text-right">Referência</th>
            <th className="py-1 text-right">Vencimentos</th>
            <th className="py-1 text-right">Descontos</th>
          </tr>
        </thead>
        <tbody>
          {r.rubricas.map((x, i) => (
            <tr key={i}>
              <td className="py-0.5 font-mono">{x.codigo}</td>
              <td className="py-0.5">{x.descricao}</td>
              <td className="py-0.5 text-right">{x.referencia ?? ''}</td>
              <td className="py-0.5 text-right tabular-nums">{x.provento ? reais(x.provento) : ''}</td>
              <td className="py-0.5 text-right tabular-nums">{x.desconto ? reais(x.desconto) : ''}</td>
            </tr>
          ))}
          {Array.from({ length: linhasVazias }).map((_, i) => (
            <tr key={`v${i}`}>
              <td colSpan={5} className="py-0.5">
                &nbsp;
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-3 border-b border-slate-400 py-2">
        <p>
          <span className="text-[10px] uppercase text-slate-600">Total de vencimentos</span>
          <br />
          <b className="tabular-nums">{reais(proventos)}</b>
        </p>
        <p>
          <span className="text-[10px] uppercase text-slate-600">Total de descontos</span>
          <br />
          <b className="tabular-nums">{reais(descontos)}</b>
        </p>
        <p className="text-right">
          <span className="text-[10px] uppercase text-slate-600">Valor líquido</span>
          <br />
          <b className="text-[15px] tabular-nums">R$ {reais(r.liquido)}</b>
        </p>
      </div>
      <div className="grid grid-cols-5 gap-2 border-b border-slate-400 py-2 text-[11px]">
        <p>
          <span className="text-[10px] uppercase text-slate-600">Salário base</span>
          <br />
          {reais(Number(item.funcionario.salarioBase))}
        </p>
        <p>
          <span className="text-[10px] uppercase text-slate-600">Base INSS</span>
          <br />
          {reais(r.baseInss)}
        </p>
        <p>
          <span className="text-[10px] uppercase text-slate-600">Base FGTS</span>
          <br />
          {reais(r.baseFgts)}
        </p>
        <p>
          <span className="text-[10px] uppercase text-slate-600">FGTS do mês</span>
          <br />
          {reais(r.fgts)}
        </p>
        <p>
          <span className="text-[10px] uppercase text-slate-600">Base IRRF</span>
          <br />
          {reais(r.irrf.base)}
        </p>
      </div>
      <div className="mt-6 flex items-end justify-between gap-6 text-[11px]">
        <p>Declaro ter recebido a importância líquida discriminada neste recibo.</p>
        <div className="text-center">
          <p>____/____/______</p>
          <p className="text-[10px] text-slate-600">Data</p>
        </div>
        <div className="w-64 text-center">
          <p className="border-t border-slate-600 pt-1">Assinatura</p>
        </div>
      </div>
    </section>
  );
}

export default function HoleritesPage({ params }: { params: { id: string } }) {
  const so = useSearchParams().get('item');
  const [folha, setFolha] = useState<FolhaDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<FolhaDetalhe>(`/folha/${params.id}`)
      .then(setFolha)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro.'));
  }, [params.id]);

  if (!folha) return <main>{erro ? <Erro msg={erro} /> : <p className="text-sm text-slate-500">Carregando…</p>}</main>;
  const itens = so ? folha.itens.filter((i) => i.id === so) : folha.itens;

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link href={`/dashboard/folha/${folha.id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-700">
            <ArrowLeft size={15} /> Voltar à folha
          </Link>
          <h1 className="mt-1 text-xl font-semibold">
            Holerites {competenciaBR(folha.competencia)} · {folha.client.razaoSocial}
          </h1>
          <p className="text-sm text-slate-500">
            {itens.length} recibo(s) · líquido total {brl(itens.reduce((s, i) => s + Number(i.liquido), 0))}
            {folha.status === 'ABERTA' && ' · folha ainda aberta: confira antes de entregar'}
          </p>
        </div>
        <Botao className="inline-flex items-center gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir ou salvar PDF
        </Botao>
      </div>
      {itens.map((i) => (
        <Holerite key={i.id} folha={folha} item={i} />
      ))}
    </main>
  );
}
