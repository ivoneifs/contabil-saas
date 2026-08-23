import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompromissoDto } from './dto/create-compromisso.dto';
import { UpdateCompromissoDto } from './dto/update-compromisso.dto';

@Injectable()
export class CompromissosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateCompromissoDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.compromisso.create({
      data: {
        organizationId,
        clientId: dto.clientId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        inicio: new Date(dto.inicio),
        fim: new Date(dto.fim),
      },
    });
  }

  findAll(organizationId: string, clientId?: string) {
    return this.prisma.compromisso.findMany({
      where: { organizationId, ...(clientId ? { clientId } : {}) },
      orderBy: { inicio: 'asc' },
      include: { client: { select: { razaoSocial: true } } },
    });
  }

  async findOne(organizationId: string, id: string) {
    const compromisso = await this.prisma.compromisso.findFirst({ where: { id, organizationId } });
    if (!compromisso) {
      throw new NotFoundException('Compromisso não encontrado.');
    }
    return compromisso;
  }

  async update(organizationId: string, id: string, dto: UpdateCompromissoDto) {
    await this.findOne(organizationId, id);
    const { inicio, fim, ...rest } = dto;
    return this.prisma.compromisso.update({
      where: { id },
      data: {
        ...rest,
        ...(inicio ? { inicio: new Date(inicio) } : {}),
        ...(fim ? { fim: new Date(fim) } : {}),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.compromisso.delete({ where: { id } });
    return { success: true };
  }
}
