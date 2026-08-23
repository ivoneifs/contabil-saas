import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateIntegracoesDto } from './dto/update-integracoes.dto';

function mask(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 4) return '****';
  return `••••${value.slice(-4)}`;
}

@Injectable()
export class IntegracoesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(organizationId: string) {
    const config = await this.prisma.integracoesConfig.findUnique({ where: { organizationId } });
    return {
      focusNfeConfigurado: !!config?.focusNfeToken,
      focusNfeTokenMascarado: mask(config?.focusNfeToken),
      focusNfeBaseUrl: config?.focusNfeBaseUrl ?? null,
      asaasConfigurado: !!config?.asaasApiKey,
      asaasApiKeyMascarado: mask(config?.asaasApiKey),
    };
  }

  async update(organizationId: string, dto: UpdateIntegracoesDto) {
    const data: Record<string, string> = {};
    if (dto.focusNfeToken) data.focusNfeToken = dto.focusNfeToken;
    if (dto.focusNfeBaseUrl) data.focusNfeBaseUrl = dto.focusNfeBaseUrl;
    if (dto.asaasApiKey) data.asaasApiKey = dto.asaasApiKey;

    await this.prisma.integracoesConfig.upsert({
      where: { organizationId },
      create: { organizationId, ...data },
      update: data,
    });

    return this.get(organizationId);
  }
}
