import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('organizations')
  async organizations() {
    const orgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { clients: true, memberships: true } },
        memberships: {
          where: { role: 'ADMIN' },
          take: 1,
          include: { user: { select: { email: true, name: true } } },
        },
      },
    });

    return orgs.map((o) => ({
      id: o.id,
      name: o.name,
      createdAt: o.createdAt,
      totalClientes: o._count.clients,
      totalUsuarios: o._count.memberships,
      adminEmail: o.memberships[0]?.user.email ?? null,
      adminNome: o.memberships[0]?.user.name ?? null,
    }));
  }
}
