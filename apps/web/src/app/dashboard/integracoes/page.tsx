'use client';

import Link from 'next/link';
import { Card, Erro, Selo, Titulo, useApi } from '@/components/ui';

interface Conector {
  id: string;
  nome: string;
  orgao: string;
  categoria: string;
  descricao: string;
  servicos: string[];
  requisitos: { id: string; rotulo: string; ok: boolean }[];
  etapa: number;
  site: string;
  status: 'CONECTADO' | 'AGUARDANDO_CREDENCIAL';
}

const ONDE_CONFIGURAR: Record<string, { href: string; texto: string }> = {
  certificadoEscritorio: { href: '/dashboard/certificados', texto: 'Enviar certificado' },
  certificadoCliente: { href: '/dashboard/certificados', texto: 'Enviar certificado' },
  serpro: { href: '/dashboard/settings', texto: 'Informar chaves' },
  nuvemFiscal: { href: '/dashboard/settings', texto: 'Informar chaves' },
  focusNfe: { href: '/dashboard/settings', texto: 'Informar token' },
  asaas: { href: '/dashboard/settings', texto: 'Informar chave' },
};

export default function IntegracoesPage() {
  const { dados, erro } = useApi<Conector[]>('/integracoes/catalogo');
  const categorias = Array.from(new Set(dados?.map((c) => c.categoria) ?? []));
  const conectados = dados?.filter((c) => c.status === 'CONECTADO').length ?? 0;

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo
        titulo="Central de integrações"
        subtitulo={`${conectados} de ${dados?.length ?? 0} conectadas. Cada integração liga sozinha quando a credencial é cadastrada.`}
      />
      <Erro msg={erro} />

      {categorias.map((cat) => (
        <section key={cat} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{cat}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dados!
              .filter((c) => c.categoria === cat)
              .map((c) => (
                <Card key={c.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{c.nome}</h3>
                      <p className="text-xs text-slate-500">{c.orgao}</p>
                    </div>
                    <Selo tom={c.status === 'CONECTADO' ? 'green' : 'amber'}>
                      {c.status === 'CONECTADO' ? '● Conectado' : '○ Aguardando'}
                    </Selo>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{c.descricao}</p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-500">
                    {c.servicos.map((s) => (
                      <li key={s}>• {s}</li>
                    ))}
                  </ul>
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                    {c.requisitos.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className={r.ok ? 'text-emerald-700' : 'text-slate-600'}>
                          {r.ok ? '✓' : '○'} {r.rotulo}
                        </span>
                        {!r.ok && ONDE_CONFIGURAR[r.id] && (
                          <Link href={ONDE_CONFIGURAR[r.id].href} className="text-indigo-700 hover:underline">
                            {ONDE_CONFIGURAR[r.id].texto}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs">
                    <span className="text-slate-400">{c.etapa === 1 ? 'Telas no ar' : `Telas na etapa ${c.etapa}`}</span>
                    <a href={c.site} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">
                      Site oficial ↗
                    </a>
                  </div>
                </Card>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
