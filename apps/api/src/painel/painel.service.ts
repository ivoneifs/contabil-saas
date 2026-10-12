import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PainelService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(organizationId: string) {
    const agora = new Date();
    const em7dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);
    const em30dias = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const [
      clientes,
      obrigacoesPendentes,
      obrigacoesAtrasadas,
      obrigacoesSemana,
      notasMes,
      funcionariosAtivos,
      aReceber,
      certificadosVencendo,
      compromissosHoje,
      proximasObrigacoes,
    ] = await Promise.all([
      this.prisma.client.count({ where: { organizationId } }),
      this.prisma.obrigacaoFiscal.count({ where: { organizationId, status: { not: 'ENTREGUE' } } }),
      this.prisma.obrigacaoFiscal.count({ where: { organizationId, status: { not: 'ENTREGUE' }, prazo: { lt: agora } } }),
      this.prisma.obrigacaoFiscal.count({
        where: { organizationId, status: { not: 'ENTREGUE' }, prazo: { gte: agora, lte: em7dias } },
      }),
      this.prisma.notaFiscal.count({ where: { organizationId, createdAt: { gte: inicioMes } } }),
      this.prisma.funcionario.count({ where: { organizationId, dataDemissao: null } }),
      this.prisma.lancamento.aggregate({
        where: { organizationId, tipo: 'A_RECEBER', status: { in: ['PENDENTE', 'VENCIDO'] } },
        _sum: { valor: true },
      }),
      this.prisma.certificadoDigital.findMany({
        where: { organizationId, validoAte: { lte: em30dias } },
        orderBy: { validoAte: 'asc' },
        select: { id: true, titular: true, validoAte: true },
      }),
      this.prisma.compromisso.count({
        where: {
          organizationId,
          inicio: { gte: new Date(agora.toDateString()), lt: new Date(new Date(agora.toDateString()).getTime() + 86400000) },
        },
      }),
      this.prisma.obrigacaoFiscal.findMany({
        where: { organizationId, status: { not: 'ENTREGUE' } },
        orderBy: { prazo: 'asc' },
        take: 8,
        select: { id: true, titulo: true, prazo: true, status: true, client: { select: { razaoSocial: true } } },
      }),
    ]);

    return {
      clientes,
      obrigacoesPendentes,
      obrigacoesAtrasadas,
      obrigacoesSemana,
      notasMes,
      funcionariosAtivos,
      aReceber: Number(aReceber._sum.valor ?? 0),
      certificadosVencendo,
      compromissosHoje,
      proximasObrigacoes,
    };
  }
}
