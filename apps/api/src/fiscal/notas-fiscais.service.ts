import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotaFiscalDto } from './dto/create-nota-fiscal.dto';
import { FISCAL_GATEWAY, FiscalGateway } from './gateways/fiscal-gateway.interface';
import { NotaFiscalStatus } from '@prisma/client';

@Injectable()
export class NotasFiscaisService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(FISCAL_GATEWAY) private readonly gateway: FiscalGateway,
  ) {}

  async emitir(organizationId: string, dto: CreateNotaFiscalDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    // Persistimos como RASCUNHO antes de chamar o gateway: se a chamada
    // externa falhar, ainda temos o registro da tentativa.
    const nota = await this.prisma.notaFiscal.create({
      data: {
        organizationId,
        clientId: client.id,
        tipo: dto.tipo,
        uf: client.uf,
        valorTotal: dto.valorTotal,
        status: NotaFiscalStatus.RASCUNHO,
      },
    });

    const resultado = await this.gateway.emitirNota(organizationId, {
      tipo: dto.tipo,
      uf: client.uf,
      cnpjCpfCliente: client.cnpjCpf,
      razaoSocialCliente: client.razaoSocial,
      valorTotal: dto.valorTotal,
      descricao: dto.descricao,
    });

    return this.prisma.notaFiscal.update({
      where: { id: nota.id },
      data: {
        status: resultado.status as NotaFiscalStatus,
        numero: resultado.numero,
        serie: resultado.serie,
        chaveAcesso: resultado.chaveAcesso,
        xmlUrl: resultado.xmlUrl,
        danfeUrl: resultado.danfeUrl,
        motivoRejeicao: resultado.motivoRejeicao,
        gatewayProvider: 'focusnfe',
        gatewayExternalId: resultado.externalId,
      },
    });
  }

  findAll(organizationId: string, clientId?: string) {
    return this.prisma.notaFiscal.findMany({
      where: { organizationId, ...(clientId ? { clientId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const nota = await this.prisma.notaFiscal.findFirst({ where: { id, organizationId } });
    if (!nota) {
      throw new NotFoundException('Nota fiscal não encontrada.');
    }
    return nota;
  }

  async atualizarStatus(organizationId: string, id: string) {
    const nota = await this.findOne(organizationId, id);
    if (!nota.gatewayExternalId) {
      return nota;
    }
    const resultado = await this.gateway.consultarNota(organizationId, nota.gatewayExternalId);
    return this.prisma.notaFiscal.update({
      where: { id: nota.id },
      data: {
        status: resultado.status as NotaFiscalStatus,
        chaveAcesso: resultado.chaveAcesso ?? nota.chaveAcesso,
        xmlUrl: resultado.xmlUrl ?? nota.xmlUrl,
        danfeUrl: resultado.danfeUrl ?? nota.danfeUrl,
        motivoRejeicao: resultado.motivoRejeicao ?? nota.motivoRejeicao,
      },
    });
  }
}
