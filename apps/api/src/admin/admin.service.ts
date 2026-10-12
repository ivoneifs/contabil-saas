import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

export interface DadosEscritorio {
  nome?: string;
  cnpj?: string | null;
  telefone?: string | null;
  plano?: string | null;
  acessoAte?: string | null;
  observacoes?: string | null;
  ativa?: boolean;
}

export interface DadosUsuario {
  nome?: string;
  email?: string;
  senha?: string;
  papel?: MembershipRole;
  ativo?: boolean;
}

const soDigitos = (v?: string | null) => (v ? v.replace(/\D/g, '') || null : null);
const data = (v?: string | null) => (v ? new Date(`${v.slice(0, 10)}T00:00:00Z`) : null);

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async resumo() {
    const agora = new Date();
    const em30 = new Date(agora.getTime() + 30 * 86400000);
    const [escritorios, ativos, bloqueados, vencendo, usuarios, clientes] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { ativa: true, OR: [{ acessoAte: null }, { acessoAte: { gte: agora } }] } }),
      this.prisma.organization.count({ where: { OR: [{ ativa: false }, { acessoAte: { lt: agora } }] } }),
      this.prisma.organization.count({ where: { ativa: true, acessoAte: { gte: agora, lte: em30 } } }),
      this.prisma.user.count(),
      this.prisma.client.count(),
    ]);
    return { escritorios, ativos, bloqueados, vencendo, usuarios, clientes };
  }

  async listarEscritorios() {
    const orgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { clients: true, memberships: true } },
        memberships: {
          where: { role: 'ADMIN' },
          take: 1,
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { email: true, name: true } } },
        },
      },
    });
    return orgs.map((o) => ({
      id: o.id,
      nome: o.name,
      cnpj: o.cnpj,
      telefone: o.telefone,
      plano: o.plano,
      acessoAte: o.acessoAte,
      observacoes: o.observacoes,
      ativa: o.ativa,
      createdAt: o.createdAt,
      totalClientes: o._count.clients,
      totalUsuarios: o._count.memberships,
      adminEmail: o.memberships[0]?.user.email ?? null,
      adminNome: o.memberships[0]?.user.name ?? null,
    }));
  }

  // Cria o escritório vendido já com o usuário administrador.
  async criarEscritorio(dados: DadosEscritorio & { adminNome: string; adminEmail: string; adminSenha: string }) {
    const email = dados.adminEmail.trim().toLowerCase();
    const cnpj = soDigitos(dados.cnpj);
    if (cnpj && (await this.prisma.organization.findUnique({ where: { cnpj } }))) {
      throw new ConflictException('Já existe um escritório com este CNPJ.');
    }
    const existente = await this.prisma.user.findUnique({ where: { email } });

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dados.nome!.trim(),
          cnpj,
          telefone: dados.telefone || null,
          plano: dados.plano || null,
          acessoAte: data(dados.acessoAte),
          observacoes: dados.observacoes || null,
          ativa: dados.ativa ?? true,
        },
      });
      const user =
        existente ??
        (await tx.user.create({
          data: { email, name: dados.adminNome.trim(), passwordHash: await bcrypt.hash(dados.adminSenha, 10) },
        }));
      await tx.membership.create({ data: { organizationId: org.id, userId: user.id, role: MembershipRole.ADMIN } });
      return { id: org.id, nome: org.name, usuarioExistente: !!existente };
    });
  }

  async atualizarEscritorio(id: string, dados: DadosEscritorio) {
    await this.obterEscritorio(id);
    const cnpj = dados.cnpj !== undefined ? soDigitos(dados.cnpj) : undefined;
    if (cnpj) {
      const outro = await this.prisma.organization.findUnique({ where: { cnpj } });
      if (outro && outro.id !== id) throw new ConflictException('Já existe um escritório com este CNPJ.');
    }
    await this.prisma.organization.update({
      where: { id },
      data: {
        ...(dados.nome ? { name: dados.nome.trim() } : {}),
        ...(cnpj !== undefined ? { cnpj } : {}),
        ...(dados.telefone !== undefined ? { telefone: dados.telefone || null } : {}),
        ...(dados.plano !== undefined ? { plano: dados.plano || null } : {}),
        ...(dados.acessoAte !== undefined ? { acessoAte: data(dados.acessoAte) } : {}),
        ...(dados.observacoes !== undefined ? { observacoes: dados.observacoes || null } : {}),
        ...(dados.ativa !== undefined ? { ativa: dados.ativa } : {}),
      },
    });
    return { ok: true };
  }

  // Exclui o escritório e TODOS os dados dele (clientes, notas, documentos...).
  // Exige digitar o nome exato como confirmação.
  async excluirEscritorio(id: string, confirmacao: string) {
    const org = await this.obterEscritorio(id);
    if (confirmacao?.trim() !== org.name) {
      throw new BadRequestException('Para excluir, digite o nome exato do escritório.');
    }
    const membros = await this.prisma.membership.findMany({ where: { organizationId: id }, select: { userId: true } });
    await this.prisma.$transaction(async (tx) => {
      await tx.organization.delete({ where: { id } });
      // Remove usuários que ficaram sem escritório (nunca o super admin).
      for (const { userId } of membros) {
        const restantes = await tx.membership.count({ where: { userId } });
        if (restantes === 0) await tx.user.deleteMany({ where: { id: userId, isSuperAdmin: false } });
      }
    });
    return { ok: true };
  }

  async listarUsuarios(organizationId: string) {
    await this.obterEscritorio(organizationId);
    const membros = await this.prisma.membership.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, email: true, ativo: true, isSuperAdmin: true, createdAt: true } } },
    });
    return membros.map((m) => ({ ...m.user, papel: m.role }));
  }

  async criarUsuario(organizationId: string, dados: Required<Pick<DadosUsuario, 'nome' | 'email' | 'senha'>> & DadosUsuario) {
    await this.obterEscritorio(organizationId);
    const email = dados.email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const ja = await this.prisma.membership.findUnique({ where: { organizationId_userId: { organizationId, userId: user.id } } });
      if (ja) throw new ConflictException('Este e-mail já é usuário deste escritório.');
    } else {
      user = await this.prisma.user.create({
        data: { email, name: dados.nome.trim(), passwordHash: await bcrypt.hash(dados.senha, 10) },
      });
    }
    await this.prisma.membership.create({
      data: { organizationId, userId: user.id, role: dados.papel ?? MembershipRole.ASSISTENTE },
    });
    return { id: user.id };
  }

  async atualizarUsuario(organizationId: string, userId: string, dados: DadosUsuario) {
    const membro = await this.prisma.membership.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
    if (!membro) throw new NotFoundException('Usuário não encontrado neste escritório.');
    if (dados.email) {
      const email = dados.email.trim().toLowerCase();
      const outro = await this.prisma.user.findUnique({ where: { email } });
      if (outro && outro.id !== userId) throw new ConflictException('Este e-mail já está em uso.');
      dados.email = email;
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dados.nome ? { name: dados.nome.trim() } : {}),
          ...(dados.email ? { email: dados.email } : {}),
          ...(dados.ativo !== undefined ? { ativo: dados.ativo } : {}),
          ...(dados.senha ? { passwordHash: await bcrypt.hash(dados.senha, 10) } : {}),
        },
      }),
      ...(dados.papel ? [this.prisma.membership.update({ where: { id: membro.id }, data: { role: dados.papel } })] : []),
    ]);
    return { ok: true };
  }

  async removerUsuario(organizationId: string, userId: string) {
    const membro = await this.prisma.membership.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
    if (!membro) throw new NotFoundException('Usuário não encontrado neste escritório.');
    await this.prisma.membership.delete({ where: { id: membro.id } });
    const restantes = await this.prisma.membership.count({ where: { userId } });
    if (restantes === 0) await this.prisma.user.deleteMany({ where: { id: userId, isSuperAdmin: false } });
    return { ok: true };
  }

  async acessar(superAdminId: string, organizationId: string) {
    const [org, admin] = await Promise.all([
      this.obterEscritorio(organizationId),
      this.prisma.user.findUniqueOrThrow({ where: { id: superAdminId } }),
    ]);
    return this.auth.tokenDeSuporte({ id: admin.id, email: admin.email }, { id: org.id, name: org.name });
  }

  private async obterEscritorio(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Escritório não encontrado.');
    return org;
  }
}
