import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const diasDepois = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

// Prazo do dia 15 do mês seguinte, antecipado se cair no fim de semana.
function dia15Seguinte(competencia: string) {
  const [ano, mes] = competencia.split('-').map(Number);
  const d = new Date(Date.UTC(ano, mes, 15));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

// Registro das pendências do eSocial geradas pelos fatos do sistema.
// Não transmite: o envio assinado entra com o certificado A1 do escritório.
@Injectable()
export class EsocialService {
  constructor(private readonly prisma: PrismaService) {}

  private async registrar(dados: {
    organizationId: string;
    clientId: string;
    funcionarioId?: string;
    evento: string;
    descricao: string;
    referencia: string;
    prazo: Date;
    chave: string;
  }) {
    await this.prisma.eventoEsocial.upsert({
      where: { organizationId_chave: { organizationId: dados.organizationId, chave: dados.chave } },
      create: dados,
      update: { descricao: dados.descricao, referencia: dados.referencia, prazo: dados.prazo },
    });
  }

  admissao(f: { id: string; organizationId: string; clientId: string; nome: string; dataAdmissao: Date; vinculo: string }) {
    // Sócio e estagiário não têm S-2200 (sócio: S-1200 com pró-labore; estagiário: S-2300).
    const evento = f.vinculo === 'ESTAGIARIO' ? 'S-2300' : f.vinculo === 'SOCIO' ? null : 'S-2200';
    if (!evento) return Promise.resolve();
    return this.registrar({
      organizationId: f.organizationId,
      clientId: f.clientId,
      funcionarioId: f.id,
      evento,
      descricao: `${evento === 'S-2300' ? 'Início de estágio (TSVE)' : 'Admissão'}: ${f.nome}`,
      referencia: f.dataAdmissao.toISOString().slice(0, 10),
      // S-2200 até o dia anterior ao início das atividades.
      prazo: diasDepois(f.dataAdmissao, evento === 'S-2200' ? -1 : 15),
      chave: `${evento}:${f.id}`,
    });
  }

  desligamento(f: { id: string; organizationId: string; clientId: string; nome: string; dataDemissao: Date; vinculo: string }) {
    const evento = f.vinculo === 'ESTAGIARIO' || f.vinculo === 'SOCIO' ? 'S-2399' : 'S-2299';
    return this.registrar({
      organizationId: f.organizationId,
      clientId: f.clientId,
      funcionarioId: f.id,
      evento,
      descricao: `Desligamento: ${f.nome}`,
      referencia: f.dataDemissao.toISOString().slice(0, 10),
      // Até 10 dias após o desligamento.
      prazo: diasDepois(f.dataDemissao, 10),
      chave: `${evento}:${f.id}`,
    });
  }

  async folhaFechada(folha: { organizationId: string; clientId: string; competencia: string }, pessoas: { id: string; nome: string }[]) {
    const prazo = dia15Seguinte(folha.competencia);
    const mes = `${folha.competencia.slice(5, 7)}/${folha.competencia.slice(0, 4)}`;
    for (const p of pessoas) {
      await this.registrar({
        organizationId: folha.organizationId,
        clientId: folha.clientId,
        funcionarioId: p.id,
        evento: 'S-1200',
        descricao: `Remuneração ${mes}: ${p.nome}`,
        referencia: folha.competencia,
        prazo,
        chave: `S-1200:${folha.competencia}:${p.id}`,
      });
    }
    await this.registrar({
      organizationId: folha.organizationId,
      clientId: folha.clientId,
      evento: 'S-1299',
      descricao: `Fechamento dos eventos periódicos ${mes}`,
      referencia: folha.competencia,
      prazo,
      chave: `S-1299:${folha.clientId}:${folha.competencia}`,
    });
  }

  listar(organizationId: string, filtros: { status?: string; clientId?: string }) {
    return this.prisma.eventoEsocial.findMany({
      where: {
        organizationId,
        ...(filtros.status ? { status: filtros.status as 'PENDENTE' | 'ENVIADO' | 'DISPENSADO' } : {}),
        ...(filtros.clientId ? { clientId: filtros.clientId } : {}),
      },
      orderBy: [{ status: 'asc' }, { prazo: 'asc' }],
      take: 500,
      include: { client: { select: { razaoSocial: true } } },
    });
  }

  async atualizar(organizationId: string, id: string, dados: { status: 'PENDENTE' | 'ENVIADO' | 'DISPENSADO'; recibo?: string; observacao?: string }) {
    await this.prisma.eventoEsocial.updateMany({
      where: { id, organizationId },
      data: { status: dados.status, recibo: dados.recibo ?? null, observacao: dados.observacao ?? null },
    });
    return { ok: true };
  }
}
