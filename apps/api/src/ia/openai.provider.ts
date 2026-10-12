import OpenAI from 'openai';
import { PedidoIa } from './tipos';

export const MODELO_PADRAO_OPENAI = 'gpt-4o-mini';

export async function gerarComOpenAi(pedido: PedidoIa): Promise<string> {
  const client = new OpenAI({ apiKey: pedido.apiKey });
  const completion = await client.chat.completions.create({
    model: pedido.modelo || MODELO_PADRAO_OPENAI,
    messages: [{ role: 'system', content: pedido.system }, ...pedido.mensagens],
    ...(pedido.json ? { response_format: { type: 'json_object' as const } } : {}),
  });
  return completion.choices[0]?.message?.content ?? '';
}
