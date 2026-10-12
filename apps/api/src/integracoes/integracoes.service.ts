import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateIntegracoesDto } from './dto/update-integracoes.dto';
import { cifrarTexto, decifrarTexto, mascarar } from '../common/cofre';
import { CONECTORES, ROTULO_REQUISITO, Requisito } from './catalogo';
import { IaService } from '../ia/ia.service';
import { ConsultasService } from '../consultas/consultas.service';
import { CertificadosService } from '../certificados/certificados.service';
import { ContextoTeste, ResultadoTeste, TESTADORES, executarTeste } from './testadores';
import { Prisma } from '@prisma/client';

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
    private readonly consultas: ConsultasService,
    private readonly certificados: CertificadosService,
  ) {}

  private async contexto(organizationId: string): Promise<ContextoTeste> {
    const [config, certEscritorio, credIa, clienteComCert] = await Promise.all([
      this.prisma.integracoesConfig.findUnique({ where: { organizationId } }),
      this.certificados.obterParaUso(organizationId, null),
      this.ia.credencial(),
      this.prisma.certificadoDigital.findFirst({
        where: { organizationId, clientId: { not: null }, validoAte: { gt: new Date() } },
        select: { clientId: true },
      }),
    ]);
    const certCliente = clienteComCert ? await this.certificados.obterParaUso(organizationId, clienteComCert.clientId) : null;
    const dec = (v?: string | null) => (v ? decifrarTexto(v) : null);
    const focusToken = config?.focusNfeToken ?? this.config.get<string>('FOCUS_NFE_TOKEN') ?? null;
    return {
      consultas: this.consultas,
      focusNfe: focusToken ? { token: focusToken, baseUrl: config?.focusNfeBaseUrl ?? this.config.get<string>('FOCUS_NFE_BASE_URL') ?? '' } : null,
      asaasKey: config?.asaasApiKey ?? null,
      nuvemFiscal:
        config?.nuvemFiscalClientId && config?.nuvemFiscalClientSecret
          ? { clientId: dec(config.nuvemFiscalClientId)!, clientSecret: dec(config.nuvemFiscalClientSecret)! }
          : null,
      serpro:
        config?.serproConsumerKey && config?.serproConsumerSecret
          ? { consumerKey: dec(config.serproConsumerKey)!, consumerSecret: dec(config.serproConsumerSecret)! }
          : null,
      certEscritorio: certEscritorio ? { pfx: certEscritorio.pfx, senha: certEscritorio.senha, documento: certEscritorio.documento } : null,
      certCliente: certCliente ? { pfx: certCliente.pfx, senha: certCliente.senha } : null,
      iaConfigurada: credIa?.origem ?? null,
    };
  }

  private async salvarTestes(organizationId: string, novos: Record<string, ResultadoTeste & { em: string }>) {
    const atual = await this.prisma.integracoesConfig.findUnique({ where: { organizationId }, select: { testes: true } });
    const testes = { ...((atual?.testes as Record<string, unknown>) ?? {}), ...novos } as Prisma.InputJsonValue;
    await this.prisma.integracoesConfig.upsert({
      where: { organizationId },
      create: { organizationId, testes },
      update: { testes },
    });
  }

  async testar(organizationId: string, id: string) {
    const r = { ...(await executarTeste(id, await this.contexto(organizationId))), em: new Date().toISOString() };
    await this.salvarTestes(organizationId, { [id]: r });
    return r;
  }

  // Verifica todas as integrações em paralelo (as gratuitas e as configuradas).
  async testarTodas(organizationId: string) {
    const ctx = await this.contexto(organizationId);
    const ids = Object.keys(TESTADORES);
    const resultados = await Promise.all(ids.map(async (id) => [id, { ...(await executarTeste(id, ctx)), em: new Date().toISOString() }] as const));
    const mapa = Object.fromEntries(resultados);
    await this.salvarTestes(organizationId, mapa);
    return mapa;
  }

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

    const testes = (config?.testes as unknown as Record<string, ResultadoTeste & { em: string }> | null) ?? {};
    return CONECTORES.map((c) => {
      const pendentes = c.requisitos.filter((r) => !atendido[r]);
      return {
        ...c,
        teste: testes[c.id] ?? null,
        requisitos: c.requisitos.map((r) => ({ id: r, rotulo: ROTULO_REQUISITO[r], ok: atendido[r] })),
        status: pendentes.length === 0 ? 'CONECTADO' : 'AGUARDANDO_CREDENCIAL',
      };
    });
  }
}
