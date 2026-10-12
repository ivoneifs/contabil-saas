import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { motivoBloqueio } from './acesso';
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
    return { ...payload, isSuperAdmin: user.isSuperAdmin };
  }
}
