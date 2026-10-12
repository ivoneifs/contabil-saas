'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { usePode } from '@/lib/permissoes';
import { Botao, Card, Erro, Indicador, Modal, Selo, Titulo, Vazio, campo, dataBR, useApi } from '@/components/ui';

interface Evento {
  id: string;
  evento: string;
  descricao: string;
  referencia: string;
  prazo: string;
  status: 'PENDENTE' | 'ENVIADO' | 'DISPENSADO';
  recibo: string | null;
  observacao: string | null;
  client: { razaoSocial: string };
}

const NOMES: Record<string, string> = {
  'S-2200': 'Admissão',
  'S-2300': 'Início TSVE (estágio)',
  'S-2299': 'Desligamento',
  'S-2399': 'Término TSVE',
  'S-1200': 'Remuneração',
  'S-1299': 'Fechamento periódicos',
};

export default function EsocialPage() {
  const pode = usePode();
  const [status, setStatus] = useState('PENDENTE');
  const { dados, erro, recarregar } = useApi<Evento[]>(`/esocial/eventos${status ? `?status=${status}` : ''}`);
  const { dados: todos } = useApi<Evento[]>('/esocial/eventos?status=PENDENTE');
  const [marcando, setMarcando] = useState<Evento | null>(null);
  const [recibo, setRecibo] = useState('');
  const [falha, setFalha] = useState<string | null>(null);
  const hoje = new Date(new Date().toDateString());
  const atrasados = todos?.filter((e) => new Date(e.prazo) < hoje).length ?? 0;
  const semana = todos?.filter((e) => new Date(e.prazo) >= hoje && new Date(e.prazo).getTime() - hoje.getTime() <= 7 * 86400000).length ?? 0;

  async function salvar(e: Evento, novo: Evento['status'], numero?: string) {
    setFalha(null);
    try {
      await apiFetch(`/esocial/eventos/${e.id}`, { method: 'PATCH', body: JSON.stringify({ status: novo, recibo: numero || undefined }) });
      setMarcando(null);
      setRecibo('');
      recarregar();
    } catch (err) {
      setFalha(err instanceof Error ? err.message : 'Erro.');
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="eSocial"
        subtitulo="Eventos que precisam ser transmitidos, gerados automaticamente a partir de admissões, desligamentos e folhas fechadas."
        acoes={
          <select className={`${campo} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDENTE">Pendentes</option>
            <option value="ENVIADO">Enviados</option>
            <option value="DISPENSADO">Dispensados</option>
            <option value="">Todos</option>
          </select>
        }
      />
      <Erro msg={falha ?? erro} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Indicador rotulo="Pendentes" valor={todos?.length ?? '–'} />
        <Indicador rotulo="Atrasados" valor={atrasados} tom={atrasados ? 'red' : 'green'} />
        <Indicador rotulo="Vencem em 7 dias" valor={semana} tom="amber" />
      </div>
      <Card className="mb-6 border-indigo-200 bg-indigo-50/50">
        <p className="text-sm text-indigo-900">
          A transmissão assinada direto ao eSocial usa o certificado A1 do escritório. Hoje o sistema controla as pendências e os prazos. Transmita
          pelo seu programa de envio ou pelo portal e registre aqui o número do recibo. O certificado pode ser testado na{' '}
          <Link href="/dashboard/integracoes" className="font-medium underline">
            central de integrações
          </Link>
          .
        </p>
      </Card>

      {!dados?.length ? (
        <Vazio>Nenhum evento {status ? status.toLowerCase() : ''}.</Vazio>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {['Evento', 'Descrição', 'Empresa', 'Referência', 'Prazo', 'Situação', ''].map((c) => (
                  <th key={c} className="whitespace-nowrap px-4 py-3 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dados.map((e) => {
                const atrasado = e.status === 'PENDENTE' && new Date(e.prazo) < hoje;
                return (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="font-mono text-xs font-semibold">{e.evento}</span>
                      <p className="text-xs text-slate-500">{NOMES[e.evento] ?? ''}</p>
                    </td>
                    <td className="px-4 py-2.5">{e.descricao}</td>
                    <td className="px-4 py-2.5">{e.client.razaoSocial}</td>
                    <td className="px-4 py-2.5">{/^\d{4}-\d{2}$/.test(e.referencia) ? `${e.referencia.slice(5)}/${e.referencia.slice(0, 4)}` : dataBR(e.referencia)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <Selo tom={atrasado ? 'red' : 'slate'}>{dataBR(e.prazo)}</Selo>
                    </td>
                    <td className="px-4 py-2.5">
                      <Selo tom={e.status === 'ENVIADO' ? 'green' : e.status === 'DISPENSADO' ? 'slate' : atrasado ? 'red' : 'amber'}>
                        {e.status === 'ENVIADO' ? `Enviado${e.recibo ? ` · ${e.recibo}` : ''}` : e.status === 'DISPENSADO' ? 'Dispensado' : atrasado ? 'Atrasado' : 'Pendente'}
                      </Selo>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      {pode('pessoal') && e.status === 'PENDENTE' && (
                        <>
                          <button className="mr-3 text-sm font-medium text-indigo-700 hover:underline" onClick={() => setMarcando(e)}>
                            Registrar envio
                          </button>
                          <button className="text-sm text-slate-500 hover:underline" onClick={() => salvar(e, 'DISPENSADO')}>
                            Dispensar
                          </button>
                        </>
                      )}
                      {pode('pessoal') && e.status !== 'PENDENTE' && (
                        <button className="text-sm text-slate-500 hover:underline" onClick={() => salvar(e, 'PENDENTE')}>
                          Voltar a pendente
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal aberto={!!marcando} titulo={`Registrar envio · ${marcando?.evento ?? ''}`} onFechar={() => setMarcando(null)}>
        <p className="mb-3 text-sm text-slate-600">{marcando?.descricao}</p>
        <label className="block text-sm font-medium">Número do recibo do eSocial</label>
        <input className={`${campo} mt-1 font-mono`} value={recibo} onChange={(e) => setRecibo(e.target.value)} placeholder="1.1.0000000000000000000" />
        <div className="mt-4 flex justify-end">
          <Botao onClick={() => marcando && salvar(marcando, 'ENVIADO', recibo)}>Marcar como enviado</Botao>
        </div>
      </Modal>
    </main>
  );
}
