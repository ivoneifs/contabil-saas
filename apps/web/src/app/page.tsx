import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold">Sistema para escritórios de contabilidade</h1>
      <div className="flex gap-4">
        <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
          Entrar
        </Link>
        <Link href="/signup" className="rounded border px-4 py-2">
          Criar escritório
        </Link>
      </div>
    </main>
  );
}
