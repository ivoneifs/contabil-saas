export enum MembershipRole {
  ADMIN = 'ADMIN',
  CONTADOR = 'CONTADOR',
  ASSISTENTE = 'ASSISTENTE',
}

export enum RegimeTributario {
  MEI = 'MEI',
  SIMPLES_NACIONAL = 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
}

export enum NotaFiscalStatus {
  RASCUNHO = 'RASCUNHO',
  ENVIADA = 'ENVIADA',
  AUTORIZADA = 'AUTORIZADA',
  REJEITADA = 'REJEITADA',
  CANCELADA = 'CANCELADA',
}

export interface OrganizationDTO {
  id: string;
  name: string;
  createdAt: string;
}
