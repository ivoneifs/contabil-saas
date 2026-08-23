import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObrigacaoFiscalDto } from './dto/create-obrigacao-fiscal.dto';
import { UpdateObrigacaoFiscalDto } from './dto/update-obrigacao-fiscal.dto';

@Injectable()
export class ObrigacoesFiscaisService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateObrigacaoFiscalDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.obrigacaoFiscal.create({
      data: {
        organizationId,
        clientId: dto.clientId,
        titulo: dto.titulo,
        competencia: dto.competencia,
        prazo: new Date(dto.prazo),
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.obrigacaoFiscal.findMany({
      where: { organizationId },
      orderBy: { prazo: 'asc' },
      include: { client: { select: { razaoSocial: true } } },
    });
  }

  async findOne(organizationId: string, id: string) {
    const obrigacao = await this.prisma.obrigacaoFiscal.findFirst({ where: { id, organizationId } });
    if (!obrigacao) {
      throw new NotFoundException('Obrigação fiscal não encontrada.');
    }
    return obrigacao;
  }

  async update(organizationId: string, id: string, dto: UpdateObrigacaoFiscalDto) {
    await this.findOne(organizationId, id);
    return this.prisma.obrigacaoFiscal.update({ where: { id }, data: { status: dto.status } });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.obrigacaoFiscal.delete({ where: { id } });
    return { success: true };
  }
}
