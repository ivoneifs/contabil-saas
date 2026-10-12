import Anthropic from '@anthropic-ai/sdk';
import { ErroIa, PedidoIa } from './tipos';

export const MODELO_PADRAO_ANTHROPIC = 'claude-opus-5-5';

export async function gerarComAnthropic(pedido: PedidoIa): Promise<string> {
  const client = new Anthropic({ apiKey: pedido.apiKey });

  // fallbacks "default": se o classificador de segurança recusar, a própria
  // API refaz o pedido no modelo de reserva recomendado.
  const response = await client.beta.messages.create({
    model: pedido.modelo || MODELO_PADRAO_ANTHROPIC,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium' },
    system: pedido.json
      ? `${pedido.system}\n\nResponda somente com o objeto JSON, sem texto antes ou depois e sem cercas de código.`
      : pedido.system,
    messages: pedido.mensagens,
  });

  if (response.stop_reason === 'refusal') {
    throw new ErroIa('A IA recusou este pedido. Reformule e tente de novo.');
  }

  const texto = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  if (response.stop_reason === 'max_tokens') {
    throw new ErroIa('A resposta da IA ficou longa demais e foi cortada. Tente um pedido mais curto.');
  }
  return texto;
}
