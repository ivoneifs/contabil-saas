import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateIntegracoesDto } from './dto/update-integracoes.dto';
import { cifrarTexto, decifrarTexto, mascarar } from '../common/cofre';
import { CONECTORES, ROTULO_REQUISITO, Requisito } from './catalogo';
import { IaService } from '../ia/ia.service';

function mascararCifrado(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return mascarar(decifrarTexto(value));
  } catch {
    return '****';
  }
}

@Injectable()
export class IntegracoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly ia: IaService,
  ) {}

  async get(organizationId: string) {
    const config = await this.prisma.integracoesConfig.findUnique({ where: { organizationId } });
    return {
      focusNfeConfigurado: !!config?.focusNfeToken,
      focusNfeTokenMascarado: mascarar(config?.focusNfeToken),
      focusNfeBaseUrl: config?.focusNfeBaseUrl ?? null,
      asaasConfigurado: !!config?.asaasApiKey,
      asaasApiKeyMascarado: mascarar(config?.asaasApiKey),
      serproConfigurado: !!(config?.serproConsumerKey && config?.serproConsumerSecret),
      serproConsumerKeyMascarado: mascararCifrado(config?.serproConsumerKey),
      nuvemFiscalConfigurado: !!(config?.nuvemFiscalClientId && config?.nuvemFiscalClientSecret),
      nuvemFiscalClientIdMascarado: mascararCifrado(config?.nuvemFiscalClientId),
    };
  }

  async update(organizationId: string, dto: UpdateIntegracoesDto) {
    const data: Record<string, string> = {};
    if (dto.focusNfeToken) data.focusNfeToken = dto.focusNfeToken;
    if (dto.focusNfeBaseUrl) data.focusNfeBaseUrl = dto.focusNfeBaseUrl;
    if (dto.asaasApiKey) data.asaasApiKey = dto.asaasApiKey;
    if (dto.serproConsumerKey) data.serproConsumerKey = cifrarTexto(dto.serproConsumerKey);
    if (dto.serproConsumerSecret) data.serproConsumerSecret = cifrarTexto(dto.serproConsumerSecret);
    if (dto.nuvemFiscalClientId) data.nuvemFiscalClientId = cifrarTexto(dto.nuvemFiscalClientId);
    if (dto.nuvemFiscalClientSecret) data.nuvemFiscalClientSecret = cifrarTexto(dto.nuvemFiscalClientSecret);

    await this.prisma.integracoesConfig.upsert({
      where: { organizationId },
      create: { organizationId, ...data },
      update: data,
    });

    return this.get(organizationId);
  }

  async catalogo(organizationId: string) {
    const agora = new Date();
    const [config, certEscritorio, certClientes, credIa] = await Promise.all([
      this.prisma.integracoesConfig.findUnique({ where: { organizationId } }),
      this.prisma.certificadoDigital.count({ where: { organizationId, clientId: null, validoAte: { gt: agora } } }),
      this.prisma.certificadoDigital.count({ where: { organizationId, clientId: { not: null }, validoAte: { gt: agora } } }),
      this.ia.credencial(),
    ]);

    const atendido: Record<Requisito, boolean> = {
      nenhum: true,
      focusNfe: !!(config?.focusNfeToken || this.config.get<string>('FOCUS_NFE_TOKEN')),
      asaas: !!config?.asaasApiKey,
      nuvemFiscal: !!(config?.nuvemFiscalClientId && config?.nuvemFiscalClientSecret),
      serpro: !!(config?.serproConsumerKey && config?.serproConsumerSecret),
      certificadoEscritorio: certEscritorio > 0,
      certificadoCliente: certClientes > 0,
      ia: !!credIa,
    };

    return CONECTORES.map((c) => {
      const pendentes = c.requisitos.filter((r) => !atendido[r]);
      return {
        ...c,
        requisitos: c.requisitos.map((r) => ({ id: r, rotulo: ROTULO_REQUISITO[r], ok: atendido[r] })),
        status: pendentes.length === 0 ? 'CONECTADO' : 'AGUARDANDO_CREDENCIAL',
      };
    });
  }
}
