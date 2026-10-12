export interface MensagemIa {
  role: 'user' | 'assistant';
  content: string;
}

export interface PedidoIa {
  apiKey: string;
  modelo?: string | null;
  system: string;
  mensagens: MensagemIa[];
  // Pede resposta em JSON (o system prompt descreve o formato).
  json?: boolean;
}

// Falha que deve chegar ao usuário com a mensagem original (ex.: recusa).
export class ErroIa extends Error {}
