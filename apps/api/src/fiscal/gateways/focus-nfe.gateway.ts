import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConsultarNotaResultado,
  EmitirNotaInput,
  EmitirNotaResultado,
  FiscalGateway,
} from './fiscal-gateway.interface';

/**
 * Adapter para o gateway fiscal Focus NFe (https://focusnfe.com.br).
 *
 * Requer FOCUS_NFE_TOKEN e FOCUS_NFE_BASE_URL configurados (ver .env.example).
 * Até essas credenciais existirem (o usuário precisa criar a própria conta
 * no provedor), este adapter recusa a chamada com um erro claro em vez de
 * simular sucesso — nunca inventamos uma nota fiscal "autorizada" sem o
 * gateway real ter confirmado isso.
 */
@Injectable()
export class FocusNfeGateway implements FiscalGateway {
  constructor(private readonly config: ConfigService) {}

  private getCredentials() {
    const token = this.config.get<string>('FOCUS_NFE_TOKEN');
    const baseUrl = this.config.get<string>('FOCUS_NFE_BASE_URL');
    if (!token || !baseUrl) {
      throw new ServiceUnavailableException(
        'Gateway fiscal (Focus NFe) não configurado. Defina FOCUS_NFE_TOKEN e FOCUS_NFE_BASE_URL.',
      );
    }
    return { token, baseUrl };
  }

  async emitirNota(input: EmitirNotaInput): Promise<EmitirNotaResultado> {
    const { token, baseUrl } = this.getCredentials();
    const endpoint = input.tipo === 'NFCE' ? '/v2/nfce' : '/v2/nfe';

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cnpj_emitente: input.cnpjCpfCliente,
        natureza_operacao: input.descricao,
        valor_total: input.valorTotal,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(`Falha ao emitir nota no Focus NFe: ${body}`);
    }

    const data = (await response.json()) as any;
    return {
      externalId: data.ref ?? data.id,
      status: data.status === 'autorizado' ? 'AUTORIZADA' : 'ENVIADA',
      numero: data.numero,
      serie: data.serie,
      chaveAcesso: data.chave_nfe ?? data.chave_nfce,
      xmlUrl: data.caminho_xml_nota_fiscal,
      danfeUrl: data.caminho_danfe,
      motivoRejeicao: data.mensagem_sefaz,
    };
  }

  async consultarNota(externalId: string): Promise<ConsultarNotaResultado> {
    const { token, baseUrl } = this.getCredentials();

    const response = await fetch(`${baseUrl}/v2/nfe/${externalId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(`Falha ao consultar nota no Focus NFe: ${body}`);
    }

    const data = (await response.json()) as any;
    return {
      status: data.status === 'autorizado' ? 'AUTORIZADA' : data.status === 'erro_autorizacao' ? 'REJEITADA' : 'ENVIADA',
      chaveAcesso: data.chave_nfe,
      xmlUrl: data.caminho_xml_nota_fiscal,
      danfeUrl: data.caminho_danfe,
      motivoRejeicao: data.mensagem_sefaz,
    };
  }
}
