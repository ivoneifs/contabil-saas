'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistentePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch<{ reply: string }>('/assistente/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: newMessages }),
      });
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao falar com o assistente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col p-8">
      <Link href="/dashboard" className="mb-4 text-sm text-blue-600">
        ← Clientes
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">Assistente</h1>

      <div className="mb-4 flex-1 space-y-3 overflow-y-auto rounded border p-4">
        {messages.length === 0 && (
          <p className="text-gray-400">Pergunte algo sobre contabilidade ou como usar o sistema.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span
              className={`inline-block max-w-[85%] rounded px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400">Pensando...</p>}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mb-2 text-sm text-red-600">
          {error}
          {error.includes('não configurado') && <> — defina OPENAI_API_KEY na API.</>}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          placeholder="Digite sua pergunta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}
