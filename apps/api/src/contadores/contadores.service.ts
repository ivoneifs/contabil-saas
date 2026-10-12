import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoriaCrc, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { cpfValido } from '../common/documentos';
import { EquipeService } from '../equipe/equipe.service';

export interface DadosContador {
  nome?: string;
  cpf?: string;
  crcNumero?: string;
  crcUf?: string;
  categoria?: CategoriaCrc;
  email?: string | null;
  telefone?: string | null;
  principal?: boolean;
  // Acesso ao sistema: senha cria o login (papel Contador); false retira.
  acesso?: { senha?: string } | false;
}

// CRC no formato do conselho: UF-número/letra (O = originário, T = transferido, S = secundário).
export const crcFormatado = (c: { crcUf: string; crcNumero: string; categoria?: CategoriaCrc }) =>
  `CRC-${c.crcUf} ${c.crcNumero}${c.categoria === 'TECNICO' ? ' (técnico)' : ''}`;

@Injectable()
export class ContadoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly equipe: EquipeService,
  ) {}

  // Dá ou retira o acesso do contador ao sistema (feito pelo administrador).
  private async ajustarAcesso(organizationId: string, quemEdita: string, contadorId: string, acesso: DadosContador['acesso']) {
    if (acesso === undefined) return;
    const c = await this.obter(organizationId, contadorId);
    if (acesso === false) {
      if (c.userId) {
        const membro = await this.prisma.membership.findUnique({ where: { organizationId_userId: { organizationId, userId: c.userId } } });
        if (membro) await this.equipe.remover(organizationId, quemEdita, c.userId);
        await this.prisma.contador.update({ where: { id: c.id }, data: { userId: null } });
      }
      return;
    }
    if (!c.email) throw new BadRequestException('Informe o e-mail do contador para criar o acesso.');
    let userId = c.userId;
    const usuario = await this.prisma.user.findUnique({ where: { email: c.email } });
    const membro = usuario ? await this.prisma.membership.findUnique({ where: { organizationId_userId: { organizationId, userId: usuario.id } } }) : null;
    if (!membro) {
      if (!usuario && (!acesso.senha || acesso.senha.length < 8)) throw new BadRequestException('Defina uma senha inicial com 8 caracteres ou mais.');
      const r = await this.equipe.criar(organizationId, { nome: c.nome, email: c.email, senha: acesso.senha ?? '', papel: 'CONTADOR' });
      userId = r.id;
    } else {
      userId = usuario!.id;
      if (acesso.senha) await this.equipe.atualizar(organizationId, quemEdita, userId, { senha: acesso.senha });
    }
    await this.prisma.contador.update({ where: { id: c.id }, data: { userId } });
  }

  listar(organizationId: string) {
    return this.prisma.contador.findMany({
      where: { organizationId },
      orderBy: [{ principal: 'desc' }, { nome: 'asc' }],
      include: { _count: { select: { clientes: true } }, user: { select: { email: true, ativo: true } } },
    });
  }

  private normalizar({ acesso: _acesso, ...d }: DadosContador) {
    const cpf = d.cpf?.replace(/\D/g, '');
    if (cpf !== undefined && !cpfValido(cpf)) throw new BadRequestException('CPF do contador inválido.');
    const crcNumero = d.crcNumero?.toUpperCase().replace(/[^0-9A-Z/-]/g, '');
    return {
      ...(d.nome !== undefined ? { nome: d.nome.trim() } : {}),
      ...(cpf !== undefined ? { cpf } : {}),
      ...(crcNumero !== undefined ? { crcNumero } : {}),
      ...(d.crcUf !== undefined ? { crcUf: d.crcUf.toUpperCase().slice(0, 2) } : {}),
      ...(d.categoria ? { categoria: d.categoria } : {}),
      ...(d.email !== undefined ? { email: d.email?.trim().toLowerCase() || null } : {}),
      ...(d.telefone !== undefined ? { telefone: d.telefone?.trim() || null } : {}),
      ...(d.principal !== undefined ? { principal: d.principal } : {}),
    };
  }

  private conflito(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Já existe um contador com este CPF ou este CRC no escritório.');
    }
    throw err;
  }

  async criar(organizationId: string, quemEdita: string, d: Required<Pick<DadosContador, 'nome' | 'cpf' | 'crcNumero' | 'crcUf'>> & DadosContador) {
    const dados = this.normalizar(d) as Prisma.ContadorUncheckedCreateInput;
    const primeiro = (await this.prisma.contador.count({ where: { organizationId } })) === 0;
    let criado;
    try {
      criado = await this.prisma.$transaction(async (tx) => {
        const principal = d.principal ?? primeiro;
        if (principal) await tx.contador.updateMany({ where: { organizationId }, data: { principal: false } });
        return tx.contador.create({ data: { ...dados, organizationId, principal } });
      });
    } catch (err) {
      this.conflito(err);
    }
    await this.ajustarAcesso(organizationId, quemEdita, criado.id, d.acesso);
    return this.obter(organizationId, criado.id);
  }

  async atualizar(organizationId: string, quemEdita: string, id: string, d: DadosContador) {
    await this.obter(organizationId, id);
    try {
      await this.prisma.$transaction(async (tx) => {
        if (d.principal) await tx.contador.updateMany({ where: { organizationId, id: { not: id } }, data: { principal: false } });
        await tx.contador.update({ where: { id }, data: this.normalizar(d) });
      });
    } catch (err) {
      this.conflito(err);
    }
    await this.ajustarAcesso(organizationId, quemEdita, id, d.acesso);
    return this.obter(organizationId, id);
  }

  async remover(organizationId: string, quemEdita: string, id: string) {
    await this.ajustarAcesso(organizationId, quemEdita, id, false);
    // Os clientes ficam sem contador vinculado (onDelete: SetNull).
    await this.prisma.contador.delete({ where: { id } });
    return { ok: true };
  }

  async obter(organizationId: string, id: string) {
    const c = await this.prisma.contador.findFirst({ where: { id, organizationId } });
    if (!c) throw new NotFoundException('Contador não encontrado.');
    return c;
  }

  async carteira(organizationId: string, id: string) {
    const contador = await this.obter(organizationId, id);
    const clientes = await this.prisma.client.findMany({
      where: { organizationId, contadorId: id },
      orderBy: { razaoSocial: 'asc' },
    });
    return { contador, clientes };
  }

  // Contador principal, usado nos documentos gerados (modelos com IA).
  principal(organizationId: string) {
    return this.prisma.contador.findFirst({ where: { organizationId }, orderBy: [{ principal: 'desc' }, { createdAt: 'asc' }] });
  }
}
