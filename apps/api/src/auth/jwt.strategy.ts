import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { motivoBloqueio } from './acesso';
import { TODAS, permissoesEfetivas } from './permissoes';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret-change-me'),
    });
  }

  // Revalida a cada requisição: um bloqueio feito pelo Super Admin vale na
  // hora, sem esperar o token de 7 dias expirar.
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { ativo: true, isSuperAdmin: true },
    });
    if (!user || !user.ativo) throw new UnauthorizedException('Usuário bloqueado ou removido.');
    if (payload.organizationId && !user.isSuperAdmin) {
      const org = await this.prisma.organization.findUnique({
        where: { id: payload.organizationId },
        select: { ativa: true, acessoAte: true },
      });
      if (!org) throw new UnauthorizedException('Escritório removido.');
      const motivo = motivoBloqueio(org);
      if (motivo) throw new ForbiddenException(motivo);
    }
    let permissoes: string[] = [];
    if (user.isSuperAdmin) permissoes = TODAS;
    else if (payload.organizationId) {
      const m = await this.prisma.membership.findUnique({
        where: { organizationId_userId: { organizationId: payload.organizationId, userId: payload.sub } },
        select: { role: true, personalizado: true, permissoes: true },
      });
      if (!m) throw new UnauthorizedException('Você não faz mais parte deste escritório.');
      permissoes = permissoesEfetivas(m);
      payload = { ...payload, role: m.role };
    }
    return { ...payload, isSuperAdmin: user.isSuperAdmin, permissoes };
  }
}
