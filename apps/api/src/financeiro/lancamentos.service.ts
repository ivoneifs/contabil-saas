import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';
import { LancamentoStatus } from '@prisma/client';

@Injectable()
export class LancamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateLancamentoDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.lancamento.create({
      data: {
        organizationId,
        clientId: dto.clientId,
        tipo: dto.tipo,
        descricao: dto.descricao,
        valor: dto.valor,
        vencimento: new Date(dto.vencimento),
      },
    });
  }

  findAll(organizationId: string, clientId?: string) {
    return this.prisma.lancamento.findMany({
      where: { organizationId, ...(clientId ? { clientId } : {}) },
      orderBy: { vencimento: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const lancamento = await this.prisma.lancamento.findFirst({ where: { id, organizationId } });
    if (!lancamento) {
      throw new NotFoundException('Lançamento não encontrado.');
    }
    return lancamento;
  }

  async update(organizationId: string, id: string, dto: UpdateLancamentoDto) {
    await this.findOne(organizationId, id);
    return this.prisma.lancamento.update({
      where: { id },
      data: {
        ...dto,
        pagoEm: dto.status === LancamentoStatus.PAGO ? new Date() : undefined,
      },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.lancamento.delete({ where: { id } });
    return { success: true };
  }
}
