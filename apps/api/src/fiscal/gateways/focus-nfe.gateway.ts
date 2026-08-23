import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ConsultarNotaResultado,
  EmitirNotaInput,
  EmitirNotaResultado,
  FiscalGateway,
} from './fiscal-gateway.interface';

/**
 * Adapter para o gateway fiscal Focus NFe (https://focusnfe.com.br).
 *
 * Credenciais: primeiro tenta a configuração da própria organização (tela
 * Configurações > Integrações); se não houver, cai para as variáveis de
 * ambiente da plataforma (FOCUS_NFE_TOKEN/FOCUS_NFE_BASE_URL). Sem nenhuma
 * das duas, recusa a chamada com um erro claro em vez de simular sucesso —
 * nunca inventamos uma nota fiscal "autorizada" sem o gateway real confirmar.
 */
@Injectable()
export class FocusNfeGateway implements FiscalGateway {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private async getCredentials(organizationId: string) {
    const org = await this.prisma.integracoesConfig.findUnique({ where: { organizationId } });
    const token = org?.focusNfeToken ?? this.config.get<string>('FOCUS_NFE_TOKEN');
    const baseUrl = org?.focusNfeBaseUrl ?? this.config.get<string>('FOCUS_NFE_BASE_URL');
    if (!token || !baseUrl) {
      throw new ServiceUnavailableException(
        'Gateway fiscal (Focus NFe) não configurado. Configure em Configurações > Integrações.',
      );
    }
    return { token, baseUrl };
  }

  async emitirNota(organizationId: string, input: EmitirNotaInput): Promise<EmitirNotaResultado> {
    const { token, baseUrl } = await this.getCredentials(organizationId);
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

  async consultarNota(organizationId: string, externalId: string): Promise<ConsultarNotaResultado> {
    const { token, baseUrl } = await this.getCredentials(organizationId);

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
