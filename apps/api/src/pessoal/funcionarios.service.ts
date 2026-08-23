import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';

@Injectable()
export class FuncionariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateFuncionarioDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.funcionario.create({
      data: {
        organizationId,
        clientId: dto.clientId,
        nome: dto.nome,
        cpf: dto.cpf,
        cargo: dto.cargo,
        salarioBase: dto.salarioBase,
        dataAdmissao: new Date(dto.dataAdmissao),
      },
    });
  }

  findAll(organizationId: string, clientId?: string) {
    return this.prisma.funcionario.findMany({
      where: { organizationId, ...(clientId ? { clientId } : {}) },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const funcionario = await this.prisma.funcionario.findFirst({ where: { id, organizationId } });
    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado.');
    }
    return funcionario;
  }

  async update(organizationId: string, id: string, dto: UpdateFuncionarioDto) {
    await this.findOne(organizationId, id);
    const { dataAdmissao, dataDemissao, ...rest } = dto;
    return this.prisma.funcionario.update({
      where: { id },
      data: {
        ...rest,
        ...(dataAdmissao ? { dataAdmissao: new Date(dataAdmissao) } : {}),
        ...(dataDemissao ? { dataDemissao: new Date(dataDemissao) } : {}),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.funcionario.delete({ where: { id } });
    return { success: true };
  }
}
