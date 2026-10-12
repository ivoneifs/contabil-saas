import { MembershipRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  organizationId: string;
  role: MembershipRole;
  isSuperAdmin: boolean;
  // Preenchido a cada requisição pela JwtStrategy (não vai no token).
  permissoes?: string[];
}
