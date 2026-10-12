import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProvedorIa } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { cifrarTexto, decifrarTexto } from '../common/cofre';
import { IaService } from './ia.service';
import { MODELO_PADRAO_ANTHROPIC } from './anthropic.provider';
import { MODELO_PADRAO_OPENAI } from './openai.provider';

const SELECT = {
  id: true,
  provedor: true,
  nome: true,
  final: true,
  modelo: true,
  ativa: true,
  padrao: true,
  ultimoTeste: true,
  ultimoErro: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface DadosChave {
  provedor?: ProvedorIa;
  nome?: string;
  chave?: string;
  modelo?: string | null;
  ativa?: boolean;
  padrao?: boolean;
}

@Injectable()
export class ChavesIaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ia: IaService,
  ) {}

  async listar() {
    const [chaves, emUso] = await Promise.all([
      this.prisma.chaveIa.findMany({ orderBy: [{ padrao: 'desc' }, { createdAt: 'asc' }], select: SELECT }),
      this.ia.credencial(),
    ]);
    return {
      chaves,
      emUso: emUso ? { provedor: emUso.provedor, origem: emUso.origem } : null,
      modelosPadrao: { ANTHROPIC: MODELO_PADRAO_ANTHROPIC, OPENAI: MODELO_PADRAO_OPENAI },
    };
  }

  async criar(dados: DadosChave) {
    if (!dados.provedor || !dados.nome || !dados.chave) {
      throw new BadRequestException('Informe provedor, nome e chave.');
    }
    const chave = dados.chave.trim();
    const primeira = (await this.prisma.chaveIa.count()) === 0;
    return this.prisma.$transaction(async (tx) => {
      const padrao = dados.padrao ?? primeira;
      if (padrao) await tx.chaveIa.updateMany({ data: { padrao: false } });
      return tx.chaveIa.create({
        data: {
          provedor: dados.provedor!,
          nome: dados.nome!.trim(),
          chaveCifrada: cifrarTexto(chave),
          final: chave.slice(-4),
          modelo: dados.modelo?.trim() || null,
          ativa: dados.ativa ?? true,
          padrao,
        },
        select: SELECT,
      });
    });
  }

  async atualizar(id: string, dados: DadosChave) {
    await this.obter(id);
    const chave = dados.chave?.trim();
    return this.prisma.$transaction(async (tx) => {
      if (dados.padrao) await tx.chaveIa.updateMany({ where: { id: { not: id } }, data: { padrao: false } });
      return tx.chaveIa.update({
        where: { id },
        data: {
          ...(dados.provedor ? { provedor: dados.provedor } : {}),
          ...(dados.nome ? { nome: dados.nome.trim() } : {}),
          ...(chave ? { chaveCifrada: cifrarTexto(chave), final: chave.slice(-4), ultimoErro: null, ultimoTeste: null } : {}),
          ...(dados.modelo !== undefined ? { modelo: dados.modelo?.trim() || null } : {}),
          ...(dados.ativa !== undefined ? { ativa: dados.ativa } : {}),
          ...(dados.padrao !== undefined ? { padrao: dados.padrao } : {}),
        },
        select: SELECT,
      });
    });
  }

  async remover(id: string) {
    await this.obter(id);
    await this.prisma.chaveIa.delete({ where: { id } });
    return { ok: true };
  }

  // Faz uma chamada mínima ao provedor para validar chave e modelo.
  async testar(id: string) {
    const c = await this.obter(id);
    const cred = { provedor: c.provedor, apiKey: decifrarTexto(c.chaveCifrada), modelo: c.modelo, origem: c.nome };
    let erro: string | null = null;
    try {
      await this.ia.chamar(cred, 'Responda apenas: OK', [{ role: 'user', content: 'Teste de conexão.' }]);
    } catch (err) {
      erro = err instanceof Error ? err.message : 'Falha no teste.';
    }
    return this.prisma.chaveIa.update({
      where: { id },
      data: { ultimoTeste: new Date(), ultimoErro: erro },
      select: SELECT,
    });
  }

  private async obter(id: string) {
    const c = await this.prisma.chaveIa.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Chave não encontrada.');
    return c;
  }
}
