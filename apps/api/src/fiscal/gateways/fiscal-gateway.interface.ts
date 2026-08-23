import { NotaFiscalTipo } from '@prisma/client';

export interface EmitirNotaInput {
  tipo: NotaFiscalTipo;
  uf: string;
  cnpjCpfCliente: string;
  razaoSocialCliente: string;
  valorTotal: number;
  descricao: string;
}

export interface EmitirNotaResultado {
  externalId: string;
  status: 'ENVIADA' | 'AUTORIZADA' | 'REJEITADA';
  numero?: string;
  serie?: string;
  chaveAcesso?: string;
  xmlUrl?: string;
  danfeUrl?: string;
  motivoRejeicao?: string;
}

export interface ConsultarNotaResultado {
  status: 'ENVIADA' | 'AUTORIZADA' | 'REJEITADA' | 'CANCELADA';
  chaveAcesso?: string;
  xmlUrl?: string;
  danfeUrl?: string;
  motivoRejeicao?: string;
}

/**
 * Abstração sobre o provedor de emissão fiscal (gateway) escolhido.
 * Mantém o resto do sistema desacoplado do provedor específico (Focus NFe,
 * eNotas, etc.) — trocar de provedor no futuro não deve exigir mudanças
 * fora de src/fiscal/gateways.
 */
export interface FiscalGateway {
  emitirNota(input: EmitirNotaInput): Promise<EmitirNotaResultado>;
  consultarNota(externalId: string): Promise<ConsultarNotaResultado>;
}

export const FISCAL_GATEWAY = Symbol('FISCAL_GATEWAY');
