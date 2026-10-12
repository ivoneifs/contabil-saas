'use client';

import { FormEvent, useState } from 'react';
import { apiFetch, apiUpload } from '@/lib/api';
import { Botao, Card, Erro, Selo, Tabela, Titulo, Vazio, campo, formatarDoc, useApi } from '@/components/ui';

interface Certificado {
  id: string;
  clientId: string | null;
  titular: string;
  documento: string | null;
  emissor: string | null;
  validoDe: string;
  validoAte: string;
  client: { razaoSocial: string } | null;
}

interface Client {
  id: string;
  razaoSocial: string;
}

function diasPara(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export default function CertificadosPage() {
  const { dados: certs, erro: erroLista, recarregar } = useApi<Certificado[]>('/certificados');
  const { dados: clients } = useApi<Client[]>('/clients');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [senha, setSenha] = useState('');
  const [clientId, setClientId] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    try {
      const form = new FormData();
      form.append('file', arquivo);
      form.append('senha', senha);
      if (clientId) form.append('clientId', clientId);
      await apiUpload('/certificados', form);
      setArquivo(null);
      setSenha('');
      (e.target as HTMLFormElement).reset();
      await recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar certificado.');
    } finally {
      setEnviando(false);
    }
  }

  async function remover(id: string) {
    if (!window.confirm('Remover este certificado do cofre?')) return;
    try {
      await apiFetch(`/certificados/${id}`, { method: 'DELETE' });
      await recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao remover.');
    }
  }

  return (
    <main className="mx-auto max-w-6xl">
      <Titulo
        titulo="Cofre de certificados A1"
        subtitulo="O arquivo .pfx e a senha ficam criptografados (AES-256). São usados só nas integrações com o eSocial, a SEFAZ e o SERPRO."
      />
      <Erro msg={erro ?? erroLista} />

      <Card className="mb-6">
        <form onSubmit={enviar} className="grid gap-3 md:grid-cols-4">
          <input type="file" accept=".pfx,.p12" required className={`${campo} md:col-span-1`} onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          <input type="password" required placeholder="Senha do certificado" className={campo} value={senha} onChange={(e) => setSenha(e.target.value)} />
          <select className={campo} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Do escritório (procurador)</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razaoSocial}
              </option>
            ))}
          </select>
          <Botao type="submit" disabled={enviando || !arquivo}>
            {enviando ? 'Validando…' : 'Adicionar ao cofre'}
          </Botao>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          O certificado do escritório (e-CNPJ ou e-CPF do contador) é usado como procurador. Os dos clientes servem para
          baixar notas recebidas na SEFAZ. Certificados A3 (token ou cartão) não funcionam em servidor.
        </p>
      </Card>

      {!certs?.length ? (
        <Vazio>Nenhum certificado no cofre.</Vazio>
      ) : (
        <Tabela cabecalho={['Titular', 'Documento', 'Uso', 'Validade', '']}>
          {certs.map((c) => {
            const dias = diasPara(c.validoAte);
            return (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.titular}</p>
                  <p className="text-xs text-slate-500">{c.emissor}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{c.documento ? formatarDoc(c.documento) : '—'}</td>
                <td className="px-4 py-3">{c.client ? c.client.razaoSocial : <Selo tom="violet">Escritório</Selo>}</td>
                <td className="px-4 py-3">
                  <Selo tom={dias < 0 ? 'red' : dias <= 30 ? 'amber' : 'green'}>
                    {new Date(c.validoAte).toLocaleDateString('pt-BR')} · {dias < 0 ? 'vencido' : `${dias} dias`}
                  </Selo>
                </td>
                <td className="px-4 py-3 text-right">
                  <Botao variante="perigo" onClick={() => remover(c.id)}>
                    Remover
                  </Botao>
                </td>
              </tr>
            );
          })}
        </Tabela>
      )}
    </main>
  );
}
