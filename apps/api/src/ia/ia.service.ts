import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ProvedorIa } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { decifrarTexto } from '../common/cofre';
import { gerarComAnthropic } from './anthropic.provider';
import { gerarComOpenAi } from './openai.provider';
import { ErroIa, MensagemIa } from './tipos';

export interface CredencialIa {
  provedor: ProvedorIa;
  apiKey: string;
  modelo: string | null;
  origem: string;
}

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // Ordem: chave padrão ativa do Super Admin > qualquer chave ativa >
  // variáveis de ambiente (ANTHROPIC_API_KEY, depois OPENAI_API_KEY).
  async credencial(): Promise<CredencialIa | null> {
    const chave = await this.prisma.chaveIa.findFirst({
      where: { ativa: true },
      orderBy: [{ padrao: 'desc' }, { updatedAt: 'desc' }],
    });
    if (chave) {
      return { provedor: chave.provedor, apiKey: decifrarTexto(chave.chaveCifrada), modelo: chave.modelo, origem: chave.nome };
    }
    const anthropic = this.config.get<string>('ANTHROPIC_API_KEY');
    if (anthropic) return { provedor: 'ANTHROPIC', apiKey: anthropic, modelo: null, origem: 'ANTHROPIC_API_KEY' };
    const openai = this.config.get<string>('OPENAI_API_KEY');
    if (openai) return { provedor: 'OPENAI', apiKey: openai, modelo: null, origem: 'OPENAI_API_KEY' };
    return null;
  }

  async gerar(system: string, mensagens: MensagemIa[], opcoes: { json?: boolean } = {}): Promise<string> {
    const cred = await this.credencial();
    if (!cred) {
      throw new ServiceUnavailableException('IA não configurada. O Super Admin precisa cadastrar uma chave em Super Admin > Chaves de IA.');
    }
    return this.chamar(cred, system, mensagens, opcoes);
  }

  async chamar(cred: CredencialIa, system: string, mensagens: MensagemIa[], opcoes: { json?: boolean } = {}) {
    const pedido = { apiKey: cred.apiKey, modelo: cred.modelo, system, mensagens, json: opcoes.json };
    try {
      return cred.provedor === 'ANTHROPIC' ? await gerarComAnthropic(pedido) : await gerarComOpenAi(pedido);
    } catch (err) {
      throw this.traduzirErro(err, cred);
    }
  }

  private traduzirErro(err: unknown, cred: CredencialIa) {
    if (err instanceof ErroIa) return new BadRequestException(err.message);
    if (err instanceof Anthropic.AuthenticationError || err instanceof OpenAI.AuthenticationError) {
      return new ServiceUnavailableException(`A chave de IA "${cred.origem}" foi recusada pelo provedor. Confira em Super Admin > Chaves de IA.`);
    }
    if (err instanceof Anthropic.NotFoundError || err instanceof OpenAI.NotFoundError) {
      return new ServiceUnavailableException(`Modelo "${cred.modelo}" não encontrado no provedor. Ajuste o modelo da chave.`);
    }
    if (err instanceof Anthropic.RateLimitError || err instanceof OpenAI.RateLimitError) {
      return new ServiceUnavailableException('Limite de uso da IA atingido. Tente de novo em instantes.');
    }
    this.logger.error(`Falha na IA (${cred.provedor}): ${err instanceof Error ? err.message : String(err)}`);
    return new ServiceUnavailableException('O provedor de IA não respondeu. Tente de novo em instantes.');
  }
}
