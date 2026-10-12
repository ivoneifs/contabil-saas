import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipRole } from '@prisma/client';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './jwt-payload.interface';
import { motivoBloqueio } from './acesso';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    // Contas são vendidas e criadas pelo Super Admin; o cadastro público só
    // abre com PERMITIR_CADASTRO_PUBLICO=true.
    if (this.config.get<string>('PERMITIR_CADASTRO_PUBLICO') !== 'true') {
      throw new ForbiddenException('Cadastro fechado. Para contratar, fale com a gente pelo WhatsApp (74) 98825-8825.');
    }
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const { user, organization, membership } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.organizationName },
      });
      const user = await tx.user.create({
        data: { email: dto.email, name: dto.name, passwordHash },
      });
      const membership = await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: MembershipRole.ADMIN,
        },
      });
      return { user, organization, membership };
    });

    return this.issueTokenResponse(
      user.id,
      user.email,
      organization.id,
      organization.name,
      membership.role,
      user.isSuperAdmin,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { memberships: { include: { organization: true } } },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    if (!user.ativo) {
      throw new ForbiddenException('Este usuário está bloqueado. Fale com o administrador.');
    }

    // Super admin entra mesmo em escritório bloqueado (para dar suporte).
    if (!user.isSuperAdmin) {
      const liberadas = user.memberships.filter((m) => !motivoBloqueio(m.organization));
      if (user.memberships.length > 0 && liberadas.length === 0) {
        throw new ForbiddenException(motivoBloqueio(user.memberships[0].organization)!);
      }
      user.memberships = liberadas;
    }

    if (user.memberships.length === 0) {
      if (user.isSuperAdmin) {
        // Super admin sem organização própria: token sem organizationId,
        // válido apenas para as rotas /admin/* (plataforma inteira).
        return this.issueTokenResponse(user.id, user.email, '', '', MembershipRole.ADMIN, true);
      }
      throw new BadRequestException('Usuário não pertence a nenhuma organização.');
    }

    let membership = user.memberships[0];
    if (user.memberships.length > 1) {
      if (!dto.organizationId) {
        return {
          requiresOrganizationSelection: true,
          organizations: user.memberships.map((m) => ({
            organizationId: m.organizationId,
            organizationName: m.organization.name,
            role: m.role,
          })),
        };
      }
      const match = user.memberships.find((m) => m.organizationId === dto.organizationId);
      if (!match) {
        throw new UnauthorizedException('Usuário não pertence a esta organização.');
      }
      membership = match;
    }

    return this.issueTokenResponse(
      user.id,
      user.email,
      membership.organizationId,
      membership.organization.name,
      membership.role,
      user.isSuperAdmin,
    );
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const currentOk = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentOk) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return { success: true };
  }

  // Token para o Super Admin abrir o painel de um escritório (suporte).
  tokenDeSuporte(superAdmin: { id: string; email: string }, org: { id: string; name: string }) {
    return this.issueTokenResponse(superAdmin.id, superAdmin.email, org.id, org.name, MembershipRole.ADMIN, true);
  }

  private issueTokenResponse(
    userId: string,
    email: string,
    organizationId: string,
    organizationName: string,
    role: MembershipRole,
    isSuperAdmin: boolean,
  ) {
    const payload: JwtPayload = { sub: userId, email, organizationId, role, isSuperAdmin };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: userId, email },
      organization: organizationId ? { id: organizationId, name: organizationName } : null,
      role,
      isSuperAdmin,
    };
  }
}
