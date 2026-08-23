import {
  BadRequestException,
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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
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
