'use client';

import { useState, useEffect, FormEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { usePode } from '@/lib/permissoes';

interface IntegracoesStatus {
  focusNfeConfigurado: boolean;
  focusNfeTokenMascarado: string | null;
  focusNfeBaseUrl: string | null;
  asaasConfigurado: boolean;
  asaasApiKeyMascarado: string | null;
  serproConfigurado: boolean;
  serproConsumerKeyMascarado: string | null;
  nuvemFiscalConfigurado: boolean;
  nuvemFiscalClientIdMascarado: string | null;
}

export default function SettingsPage() {
  const pode = usePode();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [integracoes, setIntegracoes] = useState<IntegracoesStatus | null>(null);
  const [focusNfeToken, setFocusNfeToken] = useState('');
  const [focusNfeBaseUrl, setFocusNfeBaseUrl] = useState('');
  const [asaasApiKey, setAsaasApiKey] = useState('');
  const [serproKey, setSerproKey] = useState('');
  const [serproSecret, setSerproSecret] = useState('');
  const [nuvemId, setNuvemId] = useState('');
  const [nuvemSecret, setNuvemSecret] = useState('');
  const [integError, setIntegError] = useState<string | null>(null);
  const [integSuccess, setIntegSuccess] = useState(false);
  const [integLoading, setIntegLoading] = useState(false);

  async function loadIntegracoes() {
    try {
      const data = await apiFetch<IntegracoesStatus>('/integracoes');
      setIntegracoes(data);
      setFocusNfeBaseUrl(data.focusNfeBaseUrl ?? '');
    } catch {
      // silencioso: tela de senha continua utilizável mesmo se isso falhar
    }
  }

  useEffect(() => {
    if (pode('integracoes')) loadIntegracoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pode('integracoes')]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao trocar a senha.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveIntegracoes(e: FormEvent) {
    e.preventDefault();
    setIntegError(null);
    setIntegSuccess(false);
    setIntegLoading(true);
    try {
      const data = await apiFetch<IntegracoesStatus>('/integracoes', {
        method: 'POST',
        body: JSON.stringify({
          focusNfeToken: focusNfeToken || undefined,
          focusNfeBaseUrl: focusNfeBaseUrl || undefined,
          asaasApiKey: asaasApiKey || undefined,
          serproConsumerKey: serproKey || undefined,
          serproConsumerSecret: serproSecret || undefined,
          nuvemFiscalClientId: nuvemId || undefined,
          nuvemFiscalClientSecret: nuvemSecret || undefined,
        }),
      });
      setIntegracoes(data);
      setFocusNfeToken('');
      setAsaasApiKey('');
      setSerproKey('');
      setSerproSecret('');
      setNuvemId('');
      setNuvemSecret('');
      setIntegSuccess(true);
    } catch (err) {
      setIntegError(err instanceof Error ? err.message : 'Erro ao salvar integrações.');
    } finally {
      setIntegLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md">

      <h1 className="mb-6 text-2xl font-semibold">Trocar senha</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="rounded border px-3 py-2"
          type="password"
          placeholder="Senha atual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          minLength={8}
        />
        <input
          className="rounded border px-3 py-2"
          type="password"
          placeholder="Nova senha (mín. 8 caracteres)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
        <input
          className="rounded border px-3 py-2"
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Senha alterada com sucesso.</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>

      {pode('integracoes') && (
        <>
      <h1 className="mt-10 mb-2 text-2xl font-semibold">Integrações</h1>
      <p className="mb-6 text-sm text-gray-500">
        Cole aqui as chaves dos provedores externos. Os campos ficam em branco por segurança — só
        preencha se quiser trocar o valor salvo.
      </p>

      <form onSubmit={handleSaveIntegracoes} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Focus NFe (emissão de NFe/NFCe)</label>
          <p className="mb-2 text-xs text-gray-500">
            {integracoes?.focusNfeConfigurado
              ? `Configurado (token ${integracoes.focusNfeTokenMascarado})`
              : 'Não configurado'}
          </p>
          <input
            className="mb-2 w-full rounded border px-3 py-2"
            placeholder="Token do Focus NFe"
            value={focusNfeToken}
            onChange={(e) => setFocusNfeToken(e.target.value)}
          />
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="URL base (ex: https://homologacao.focusnfe.com.br)"
            value={focusNfeBaseUrl}
            onChange={(e) => setFocusNfeBaseUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Asaas (cobrança/boletos)</label>
          <p className="mb-2 text-xs text-gray-500">
            {integracoes?.asaasConfigurado
              ? `Configurado (chave ${integracoes.asaasApiKeyMascarado})`
              : 'Não configurado'}
          </p>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="API key do Asaas"
            value={asaasApiKey}
            onChange={(e) => setAsaasApiKey(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">SERPRO Integra Contador (Receita Federal)</label>
          <p className="mb-2 text-xs text-gray-500">
            {integracoes?.serproConfigurado
              ? `Configurado (consumer key ${integracoes.serproConsumerKeyMascarado})`
              : 'Não configurado. As chaves ficam na área do cliente da Loja SERPRO após contratar.'}
          </p>
          <input
            className="mb-2 w-full rounded border px-3 py-2"
            placeholder="Consumer Key"
            value={serproKey}
            onChange={(e) => setSerproKey(e.target.value)}
          />
          <input
            className="w-full rounded border px-3 py-2"
            type="password"
            placeholder="Consumer Secret"
            value={serproSecret}
            onChange={(e) => setSerproSecret(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Nuvem Fiscal (NFS-e, CT-e, MDF-e)</label>
          <p className="mb-2 text-xs text-gray-500">
            {integracoes?.nuvemFiscalConfigurado
              ? `Configurado (client id ${integracoes.nuvemFiscalClientIdMascarado})`
              : 'Não configurado'}
          </p>
          <input
            className="mb-2 w-full rounded border px-3 py-2"
            placeholder="Client ID"
            value={nuvemId}
            onChange={(e) => setNuvemId(e.target.value)}
          />
          <input
            className="w-full rounded border px-3 py-2"
            type="password"
            placeholder="Client Secret"
            value={nuvemSecret}
            onChange={(e) => setNuvemSecret(e.target.value)}
          />
        </div>

        {integError && <p className="text-sm text-red-600">{integError}</p>}
        {integSuccess && <p className="text-sm text-green-600">Integrações salvas.</p>}

        <button
          type="submit"
          disabled={integLoading}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {integLoading ? 'Salvando...' : 'Salvar integrações'}
        </button>
      </form>
        </>
      )}
    </main>
  );
}
