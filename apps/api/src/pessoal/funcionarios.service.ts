import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { EsocialService } from '../folha/esocial.service';

@Injectable()
export class FuncionariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly esocial: EsocialService,
  ) {}

  async create(organizationId: string, dto: CreateFuncionarioDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    const { dataAdmissao, dataNascimento, ...resto } = dto;
    const f = await this.prisma.funcionario.create({
      data: {
        ...resto,
        organizationId,
        cpf: dto.cpf.replace(/\D/g, ''),
        dataAdmissao: new Date(dataAdmissao),
        ...(dataNascimento ? { dataNascimento: new Date(dataNascimento) } : {}),
      },
    });
    await this.esocial.admissao(f);
    return f;
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
    const antes = await this.findOne(organizationId, id);
    const { dataAdmissao, dataDemissao, dataNascimento, clientId: _ignorado, ...rest } = dto;
    const f = await this.prisma.funcionario.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.cpf ? { cpf: rest.cpf.replace(/\D/g, '') } : {}),
        ...(dataAdmissao ? { dataAdmissao: new Date(dataAdmissao) } : {}),
        ...(dataNascimento ? { dataNascimento: new Date(dataNascimento) } : {}),
        // dataDemissao: string vazia reativa o funcionário
        ...(dataDemissao !== undefined ? { dataDemissao: dataDemissao ? new Date(dataDemissao) : null } : {}),
      },
    });
    if (f.dataDemissao && !antes.dataDemissao) await this.esocial.desligamento({ ...f, dataDemissao: f.dataDemissao });
    return f;
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.funcionario.delete({ where: { id } });
    return { success: true };
  }
}
