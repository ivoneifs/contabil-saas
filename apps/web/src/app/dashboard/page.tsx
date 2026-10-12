'use client';

import Link from 'next/link';
import { Card, Erro, Indicador, Selo, Titulo, Vazio, brl, dataBR, useApi } from '@/components/ui';
import StatusSefaz from '@/components/status-sefaz';

interface Resumo {
  clientes: number;
  obrigacoesPendentes: number;
  obrigacoesAtrasadas: number;
  obrigacoesSemana: number;
  notasMes: number;
  funcionariosAtivos: number;
  aReceber: number;
  compromissosHoje: number;
  certificadosVencendo: { id: string; titular: string; validoAte: string }[];
  proximasObrigacoes: { id: string; titulo: string; prazo: string; status: string; client: { razaoSocial: string } }[];
}

interface Conector {
  id: string;
  nome: string;
  status: 'CONECTADO' | 'AGUARDANDO_CREDENCIAL';
  teste: { ok: boolean } | null;
}

export default function PainelPage() {
  const { dados: r, erro } = useApi<Resumo>('/painel/resumo');
  const { dados: conectores } = useApi<Conector[]>('/integracoes/catalogo');
  const conectados = conectores?.filter((c) => c.teste?.ok).length ?? 0;
  const hoje = new Date();

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="Painel do escritório"
        subtitulo={hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />
      <Erro msg={erro} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador rotulo="Clientes" valor={r?.clientes ?? '–'} detalhe={`${r?.funcionariosAtivos ?? 0} funcionários ativos`} />
        <Indicador
          rotulo="Obrigações atrasadas"
          valor={r?.obrigacoesAtrasadas ?? '–'}
          tom={r && r.obrigacoesAtrasadas > 0 ? 'red' : 'green'}
          detalhe={`${r?.obrigacoesPendentes ?? 0} pendentes no total`}
        />
        <Indicador rotulo="Vencem em 7 dias" valor={r?.obrigacoesSemana ?? '–'} tom="amber" detalhe={`${r?.compromissosHoje ?? 0} compromissos hoje`} />
        <Indicador rotulo="A receber" valor={r ? brl(r.aReceber) : '–'} tom="indigo" detalhe={`${r?.notasMes ?? 0} notas emitidas no mês`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Próximas obrigações</h2>
            <Link href="/dashboard/calendario" className="text-sm text-indigo-700 hover:underline">
              Agenda inteligente →
            </Link>
          </div>
          {!r?.proximasObrigacoes.length ? (
            <Vazio>
              Nenhuma obrigação pendente. Gere as do mês na{' '}
              <Link href="/dashboard/calendario" className="text-indigo-700 underline">
                agenda inteligente
              </Link>
              .
            </Vazio>
          ) : (
            <ul className="divide-y divide-slate-100">
              {r.proximasObrigacoes.map((o) => {
                const atrasada = new Date(o.prazo) < new Date(hoje.toDateString());
                return (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{o.titulo}</p>
                      <p className="truncate text-xs text-slate-500">{o.client.razaoSocial}</p>
                    </div>
                    <Selo tom={atrasada ? 'red' : 'slate'}>{dataBR(o.prazo)}</Selo>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Integrações</h2>
              <Link href="/dashboard/integracoes" className="text-sm text-indigo-700 hover:underline">
                Ver todas →
              </Link>
            </div>
            <p className="text-3xl font-semibold tabular-nums">
              {conectados}
              <span className="text-base font-normal text-slate-400">/{conectores?.length ?? 0}</span>
            </p>
            <p className="text-xs text-slate-500">funcionando (verificadas automaticamente)</p>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">SEFAZ agora</h2>
              <Link href="/dashboard/consultas" className="text-sm text-indigo-700 hover:underline">
                Detalhes →
              </Link>
            </div>
            <StatusSefaz compacto />
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Certificados A1</h2>
              <Link href="/dashboard/certificados" className="text-sm text-indigo-700 hover:underline">
                Cofre →
              </Link>
            </div>
            {!r?.certificadosVencendo.length ? (
              <p className="text-sm text-slate-500">Nenhum certificado vence nos próximos 30 dias.</p>
            ) : (
              <ul className="space-y-2">
                {r.certificadosVencendo.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{c.titular}</span>
                    <Selo tom={new Date(c.validoAte) < hoje ? 'red' : 'amber'}>{new Date(c.validoAte).toLocaleDateString('pt-BR')}</Selo>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
