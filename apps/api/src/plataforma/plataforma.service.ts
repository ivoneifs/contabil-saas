import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DadosPlataforma {
  nomeSistema?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  corDestaque?: string;
  whatsapp?: string;
  precoAVista?: number;
  parcelas?: number;
  valorParcela?: number;
}

@Injectable()
export class PlataformaService {
  constructor(private readonly prisma: PrismaService) {}

  obter() {
    return this.prisma.configuracaoPlataforma.upsert({
      where: { id: 'plataforma' },
      create: { id: 'plataforma' },
      update: {},
    });
  }

  atualizar(dados: DadosPlataforma) {
    return this.prisma.configuracaoPlataforma.upsert({
      where: { id: 'plataforma' },
      create: { id: 'plataforma', ...dados },
      update: dados,
    });
  }

  restaurarPadrao() {
    return this.prisma.configuracaoPlataforma.upsert({
      where: { id: 'plataforma' },
      create: { id: 'plataforma' },
      update: {
        nomeSistema: 'Genesis IA Contabilidade',
        corPrimaria: '#6366f1',
        corSecundaria: '#8b5cf6',
        corDestaque: '#c8ff4d',
      },
    });
  }
}
