'use client';

import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Botao, Card, Erro, Selo, Titulo, campo, formatarDoc } from '@/components/ui';

interface Cnpj {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  descricao_situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  natureza_juridica: string;
  porte: string;
  capital_social: number;
  opcao_pelo_simples: boolean | null;
  opcao_pelo_mei: boolean | null;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  email: string | null;
  qsa: { nome_socio: string; qualificacao_socio: string; data_entrada_sociedade: string }[];
  cnaes_secundarios: { codigo: number; descricao: string }[];
}

interface Cep {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
}

function Linha({ r, v }: { r: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{r}</span>
      <span className="text-right font-medium">{v || '—'}</span>
    </div>
  );
}

export default function ConsultasPage() {
  const [cnpj, setCnpj] = useState('');
  const [cep, setCep] = useState('');
  const [dadosCnpj, setDadosCnpj] = useState<Cnpj | null>(null);
  const [dadosCep, setDadosCep] = useState<Cep | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<'cnpj' | 'cep' | null>(null);

  async function consultarCnpj(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando('cnpj');
    try {
      setDadosCnpj(await apiFetch<Cnpj>(`/consultas/cnpj/${cnpj.replace(/\D/g, '')}`));
    } catch (err) {
      setDadosCnpj(null);
      setErro(err instanceof Error ? err.message : 'Erro na consulta.');
    } finally {
      setCarregando(null);
    }
  }

  async function consultarCep(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando('cep');
    try {
      setDadosCep(await apiFetch<Cep>(`/consultas/cep/${cep.replace(/\D/g, '')}`));
    } catch (err) {
      setDadosCep(null);
      setErro(err instanceof Error ? err.message : 'Erro na consulta.');
    } finally {
      setCarregando(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      <Titulo titulo="Consultas públicas" subtitulo="CNPJ com dados da Receita Federal (dados abertos) e CEP dos Correios, via BrasilAPI." />
      <Erro msg={erro} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <form onSubmit={consultarCnpj} className="flex gap-2">
              <input className={campo} placeholder="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required />
              <Botao type="submit" disabled={carregando === 'cnpj'}>
                {carregando === 'cnpj' ? 'Consultando…' : 'Consultar CNPJ'}
              </Botao>
            </form>
          </Card>

          {dadosCnpj && (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{dadosCnpj.razao_social}</h2>
                  <p className="text-sm text-slate-500">
                    {dadosCnpj.nome_fantasia || 'Sem nome fantasia'} · {formatarDoc(dadosCnpj.cnpj)}
                  </p>
                </div>
                <Selo tom={dadosCnpj.descricao_situacao_cadastral === 'ATIVA' ? 'green' : 'red'}>{dadosCnpj.descricao_situacao_cadastral}</Selo>
              </div>
              <div className="mt-4 grid gap-x-8 md:grid-cols-2">
                <div>
                  <Linha r="Abertura" v={dadosCnpj.data_inicio_atividade?.split('-').reverse().join('/')} />
                  <Linha r="Natureza jurídica" v={dadosCnpj.natureza_juridica} />
                  <Linha r="Porte" v={dadosCnpj.porte} />
                  <Linha r="Capital social" v={Number(dadosCnpj.capital_social).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                  <Linha r="Simples Nacional" v={dadosCnpj.opcao_pelo_simples ? 'Optante' : 'Não optante'} />
                  <Linha r="MEI" v={dadosCnpj.opcao_pelo_mei ? 'Sim' : 'Não'} />
                </div>
                <div>
                  <Linha r="Endereço" v={`${dadosCnpj.logradouro}, ${dadosCnpj.numero} · ${dadosCnpj.bairro}`} />
                  <Linha r="Município" v={`${dadosCnpj.municipio}/${dadosCnpj.uf}`} />
                  <Linha r="CEP" v={dadosCnpj.cep} />
                  <Linha r="Telefone" v={dadosCnpj.ddd_telefone_1} />
                  <Linha r="E-mail" v={dadosCnpj.email?.toLowerCase()} />
                </div>
              </div>
              <h3 className="mt-5 text-sm font-semibold">Atividade principal</h3>
              <p className="text-sm text-slate-600">
                {dadosCnpj.cnae_fiscal} · {dadosCnpj.cnae_fiscal_descricao}
              </p>
              {!!dadosCnpj.cnaes_secundarios?.filter((c) => c.codigo).length && (
                <>
                  <h3 className="mt-4 text-sm font-semibold">Atividades secundárias</h3>
                  <ul className="mt-1 space-y-0.5 text-sm text-slate-600">
                    {dadosCnpj.cnaes_secundarios
                      .filter((c) => c.codigo)
                      .map((c) => (
                        <li key={c.codigo}>
                          {c.codigo} · {c.descricao}
                        </li>
                      ))}
                  </ul>
                </>
              )}
              {!!dadosCnpj.qsa?.length && (
                <>
                  <h3 className="mt-4 text-sm font-semibold">Quadro societário</h3>
                  <ul className="mt-1 divide-y divide-slate-100 text-sm">
                    {dadosCnpj.qsa.map((s) => (
                      <li key={s.nome_socio} className="flex justify-between gap-3 py-1.5">
                        <span>{s.nome_socio}</span>
                        <span className="text-slate-500">{s.qualificacao_socio}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <form onSubmit={consultarCep} className="flex gap-2">
              <input className={campo} placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value)} required />
              <Botao type="submit" disabled={carregando === 'cep'}>
                {carregando === 'cep' ? '…' : 'Buscar'}
              </Botao>
            </form>
            {dadosCep && (
              <div className="mt-4">
                <Linha r="Logradouro" v={dadosCep.street} />
                <Linha r="Bairro" v={dadosCep.neighborhood} />
                <Linha r="Cidade" v={`${dadosCep.city}/${dadosCep.state}`} />
                <Linha r="CEP" v={dadosCep.cep} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
