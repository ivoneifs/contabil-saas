import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request.user?.isSuperAdmin) {
      throw new ForbiddenException('Acesso restrito ao super admin da plataforma.');
    }
    return true;
  }
}
