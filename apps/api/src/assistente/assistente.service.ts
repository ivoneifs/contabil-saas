import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { ChatDto } from './dto/chat.dto';

const SYSTEM_PROMPT = `Você é o assistente de IA de um sistema de gestão para escritórios de contabilidade (contabil-saas).
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
  private client: OpenAI | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = this.config.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        throw new ServiceUnavailableException(
          'Assistente de IA não configurado. Defina OPENAI_API_KEY.',
        );
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  async chat(organizationId: string, dto: ChatDto): Promise<{ reply: string }> {
    const openai = this.getClient();

    let contextoCliente = '';
    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, organizationId },
      });
      if (client) {
        contextoCliente = `\n\nContexto do cliente atualmente aberto na tela:\n- Razão social: ${client.razaoSocial}\n- CNPJ/CPF: ${client.cnpjCpf}\n- Regime tributário: ${client.regimeTributario ?? 'não informado'}\n- UF: ${client.uf}`;
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + contextoCliente },
        ...dto.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? '';
    return { reply };
  }
}
