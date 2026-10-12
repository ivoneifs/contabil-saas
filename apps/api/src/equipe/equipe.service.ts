import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PADRAO_POR_PAPEL, PERMISSOES, TODAS, permissoesEfetivas } from '../auth/permissoes';

export interface DadosMembro {
  nome?: string;
  email?: string;
  senha?: string;
  papel?: MembershipRole;
  ativo?: boolean;
  // null = voltar ao padrão do papel
  permissoes?: string[] | null;
}

// Gestão da equipe pelo administrador do próprio escritório.
@Injectable()
export class EquipeService {
  constructor(private readonly prisma: PrismaService) {}

  catalogo() {
    return { permissoes: PERMISSOES, padrao: PADRAO_POR_PAPEL };
  }

  async listar(organizationId: string) {
    const membros = await this.prisma.membership.findMany({
      where: { organizationId, user: { isSuperAdmin: false } },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, email: true, ativo: true } } },
    });
    return membros.map((m) => ({
      id: m.user.id,
      nome: m.user.name,
      email: m.user.email,
      ativo: m.user.ativo,
      papel: m.role,
      personalizado: m.role !== 'ADMIN' && m.personalizado,
      permissoes: permissoesEfetivas(m),
    }));
  }

  private filtrar(lista: string[]) {
    return Array.from(new Set(lista.filter((p) => (TODAS as string[]).includes(p))));
  }

  async criar(organizationId: string, dados: Required<Pick<DadosMembro, 'nome' | 'email' | 'senha'>> & DadosMembro) {
    const email = dados.email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const ja = await this.prisma.membership.findUnique({ where: { organizationId_userId: { organizationId, userId: user.id } } });
      if (ja) throw new ConflictException('Este e-mail já faz parte da equipe.');
    } else {
      user = await this.prisma.user.create({ data: { email, name: dados.nome.trim(), passwordHash: await bcrypt.hash(dados.senha, 10) } });
    }
    const personalizado = Array.isArray(dados.permissoes);
    await this.prisma.membership.create({
      data: {
        organizationId,
        userId: user.id,
        role: dados.papel ?? 'ASSISTENTE',
        personalizado,
        permissoes: personalizado ? this.filtrar(dados.permissoes!) : [],
      },
    });
    return { id: user.id };
  }

  async atualizar(organizationId: string, quemEdita: string, userId: string, dados: DadosMembro) {
    const m = await this.membro(organizationId, userId);
    if (userId === quemEdita && (dados.papel && dados.papel !== m.role || dados.ativo === false)) {
      throw new BadRequestException('Você não pode mudar o próprio papel nem se bloquear.');
    }
    if (m.role === 'ADMIN' && dados.papel && dados.papel !== 'ADMIN') await this.garantirOutroAdmin(organizationId, userId);
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
      this.prisma.membership.update({
        where: { id: m.id },
        data: {
          ...(dados.papel ? { role: dados.papel } : {}),
          ...(dados.permissoes === null ? { personalizado: false, permissoes: [] } : {}),
          ...(Array.isArray(dados.permissoes) ? { personalizado: true, permissoes: this.filtrar(dados.permissoes) } : {}),
        },
      }),
    ]);
    return { ok: true };
  }

  async remover(organizationId: string, quemEdita: string, userId: string) {
    if (userId === quemEdita) throw new BadRequestException('Você não pode remover a si mesmo.');
    const m = await this.membro(organizationId, userId);
    if (m.role === 'ADMIN') await this.garantirOutroAdmin(organizationId, userId);
    await this.prisma.membership.delete({ where: { id: m.id } });
    const restantes = await this.prisma.membership.count({ where: { userId } });
    if (restantes === 0) await this.prisma.user.deleteMany({ where: { id: userId, isSuperAdmin: false } });
    return { ok: true };
  }

  private async membro(organizationId: string, userId: string) {
    const m = await this.prisma.membership.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
    if (!m) throw new NotFoundException('Usuário não encontrado na equipe.');
    return m;
  }

  private async garantirOutroAdmin(organizationId: string, userId: string) {
    const outros = await this.prisma.membership.count({ where: { organizationId, role: 'ADMIN', userId: { not: userId } } });
    if (!outros) throw new BadRequestException('O escritório precisa de pelo menos um administrador.');
  }
}
