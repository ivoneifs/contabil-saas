import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IaService } from '../ia/ia.service';
import { ChatDto } from './dto/chat.dto';

const SYSTEM_PROMPT = `Você é o assistente de IA de um sistema de gestão para escritórios de contabilidade (Genesis IA Contabilidade).
Ajude o contador com dúvidas sobre os módulos do sistema (Clientes, Fiscal, Financeiro, Pessoal, Agenda, Documentos),
sobre contabilidade em geral (regimes tributários, obrigações fiscais, prazos) e sobre como usar o próprio sistema.

Regras:
- Responda em português do Brasil, de forma objetiva.
- Se a pergunta envolver um cálculo fiscal específico, uma interpretação legal complexa, ou algo que possa gerar
  risco de multa/erro se você errar, deixe claro que é uma orientação geral e recomende confirmar com fontes oficiais
  ou um especialista antes de agir.
- Nunca invente números de leis, alíquotas ou prazos que você não tem certeza.`;

@Injectable()
export class AssistenteService {
  constructor(
    private readonly ia: IaService,
    private readonly prisma: PrismaService,
  ) {}

  // Uma chamada simples (system + user) para os módulos que usam IA
  // (agenda inteligente, modelos de documentos).
  completar(system: string, user: string, opcoes: { json?: boolean } = {}): Promise<string> {
    return this.ia.gerar(system, [{ role: 'user', content: user }], opcoes);
  }

  async chat(organizationId: string, dto: ChatDto): Promise<{ reply: string }> {
    let contextoCliente = '';
    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, organizationId },
      });
      if (client) {
        contextoCliente = `\n\nContexto do cliente atualmente aberto na tela:\n- Razão social: ${client.razaoSocial}\n- CNPJ/CPF: ${client.cnpjCpf}\n- Regime tributário: ${client.regimeTributario ?? 'não informado'}\n- UF: ${client.uf}`;
      }
    }

    const reply = await this.ia.gerar(
      SYSTEM_PROMPT + contextoCliente,
      dto.messages.map((m) => ({ role: m.role, content: m.content })),
    );
    return { reply };
  }
}
