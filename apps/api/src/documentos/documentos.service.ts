import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentoCategoria } from '@prisma/client';

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(
    organizationId: string,
    clientId: string,
    categoria: DocumentoCategoria | undefined,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('Arquivo excede o limite de 15MB.');
    }

    const client = await this.prisma.client.findFirst({ where: { id: clientId, organizationId } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    const documento = await this.prisma.documento.create({
      data: {
        organizationId,
        clientId,
        categoria: categoria ?? DocumentoCategoria.OUTRO,
        nomeArquivo: file.originalname,
        mimeType: file.mimetype,
        tamanhoBytes: file.size,
        conteudo: new Uint8Array(file.buffer),
      },
      select: {
        id: true,
        clientId: true,
        categoria: true,
        nomeArquivo: true,
        mimeType: true,
        tamanhoBytes: true,
        createdAt: true,
      },
    });

    return documento;
  }

  findAll(organizationId: string, clientId?: string) {
    return this.prisma.documento.findMany({
      where: { organizationId, ...(clientId ? { clientId } : {}) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        clientId: true,
        categoria: true,
        nomeArquivo: true,
        mimeType: true,
        tamanhoBytes: true,
        createdAt: true,
      },
    });
  }

  async findConteudo(organizationId: string, id: string) {
    const documento = await this.prisma.documento.findFirst({ where: { id, organizationId } });
    if (!documento) {
      throw new NotFoundException('Documento não encontrado.');
    }
    return documento;
  }

  async remove(organizationId: string, id: string) {
    const documento = await this.prisma.documento.findFirst({ where: { id, organizationId } });
    if (!documento) {
      throw new NotFoundException('Documento não encontrado.');
    }
    await this.prisma.documento.delete({ where: { id } });
    return { success: true };
  }
}
