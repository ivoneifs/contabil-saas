import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permissao, PERMISSOES } from './permissoes';
import { JwtPayload } from './jwt-payload.interface';

const CHAVE = 'permissoes';

// Exige ao menos uma das permissões listadas (no método ou na classe).
export const Requer = (...permissoes: Permissao[]) => SetMetadata(CHAVE, permissoes);

@Injectable()
export class PermissoesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const exigidas = this.reflector.getAllAndOverride<Permissao[] | undefined>(CHAVE, [ctx.getHandler(), ctx.getClass()]);
    if (!exigidas?.length) return true;
    const user = ctx.switchToHttp().getRequest().user as JwtPayload | undefined;
    if (user?.isSuperAdmin) return true;
    if (exigidas.some((p) => user?.permissoes?.includes(p))) return true;
    const nome = PERMISSOES.find((p) => p.chave === exigidas[0])?.nome ?? exigidas[0];
    throw new ForbiddenException(`Você não tem permissão para: ${nome}. Peça ao administrador do escritório.`);
  }
}
