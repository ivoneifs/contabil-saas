import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RegimeTributario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultasService } from '../consultas/consultas.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

const MAX_IMPORTACAO = 100;

interface DadosCnpj {
  razao_social: string;
  nome_fantasia?: string;
  uf: string;
  municipio?: string;
  email?: string | null;
  ddd_telefone_1?: string;
  opcao_pelo_simples?: boolean | null;
  opcao_pelo_mei?: boolean | null;
}

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consultas: ConsultasService,
  ) {}

  // Cadastra vários clientes de uma vez a partir de uma lista de CNPJs,
  // preenchendo os dados pela Receita (BrasilAPI). CNPJs já cadastrados
  // ou não encontrados voltam no relatório, sem interromper o lote.
  async importarCnpjs(organizationId: string, entrada: string[]) {
    const cnpjs = [...new Set(entrada.map((c) => c.replace(/\D/g, '')).filter(Boolean))];
    if (!cnpjs.length) throw new BadRequestException('Informe ao menos um CNPJ.');
    if (cnpjs.length > MAX_IMPORTACAO) {
      throw new BadRequestException(`Importe no máximo ${MAX_IMPORTACAO} CNPJs por vez.`);
    }

    const existentes = new Set(
      (
        await this.prisma.client.findMany({
          where: { organizationId, cnpjCpf: { in: cnpjs } },
          select: { cnpjCpf: true },
        })
      ).map((c) => c.cnpjCpf),
    );

    const resultado: { cnpj: string; status: 'criado' | 'existente' | 'erro'; razaoSocial?: string; erro?: string }[] = [];
    const fila = [...cnpjs];

    const worker = async () => {
      for (let cnpj = fila.shift(); cnpj; cnpj = fila.shift()) {
        if (cnpj.length !== 14) {
          resultado.push({ cnpj, status: 'erro', erro: 'CNPJ deve ter 14 dígitos.' });
          continue;
        }
        if (existentes.has(cnpj)) {
          resultado.push({ cnpj, status: 'existente' });
          continue;
        }
        try {
          const d = (await this.consultas.cnpj(cnpj)) as DadosCnpj;
          const client = await this.prisma.client.create({
            data: {
              organizationId,
              cnpjCpf: cnpj,
              razaoSocial: d.razao_social,
              nomeFantasia: d.nome_fantasia || null,
              uf: d.uf,
              municipio: d.municipio || null,
              email: d.email?.toLowerCase() || null,
              telefone: d.ddd_telefone_1?.trim() || null,
              regimeTributario: d.opcao_pelo_mei
                ? RegimeTributario.MEI
                : d.opcao_pelo_simples
                  ? RegimeTributario.SIMPLES_NACIONAL
                  : null,
            },
          });
          resultado.push({ cnpj, status: 'criado', razaoSocial: client.razaoSocial });
        } catch (err) {
          resultado.push({ cnpj, status: 'erro', erro: err instanceof Error ? err.message : 'Falha ao consultar.' });
        }
      }
    };
    // Poucas requisições em paralelo para não estourar o limite da BrasilAPI.
    await Promise.all(Array.from({ length: 3 }, worker));

    return {
      criados: resultado.filter((r) => r.status === 'criado').length,
      existentes: resultado.filter((r) => r.status === 'existente').length,
      erros: resultado.filter((r) => r.status === 'erro').length,
      resultado,
    };
  }

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
