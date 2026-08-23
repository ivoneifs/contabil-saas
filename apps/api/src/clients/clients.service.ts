import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  create(organizationId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: { ...dto, organizationId },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.client.findMany({
      where: { organizationId },
      orderBy: { razaoSocial: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    // organizationId always in the where clause: a user from another tenant
    // gets a 404, never a 200 with someone else's data.
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    return client;
  }

  async update(organizationId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(organizationId, id);
    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.client.delete({ where: { id } });
    return { success: true };
  }
}
