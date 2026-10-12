'use client';

import { useEffect, useState } from 'react';
import { Building2, CalendarClock, Check, FilePenLine, Sparkles } from 'lucide-react';

// Demonstração animada do que o sistema faz sozinho, do CNPJ ao plano da semana.
const ETAPAS = [
  {
    icon: Building2,
    rotulo: 'Carteira importada',
    fonte: 'Receita Federal · 08:02',
    texto: '48 CNPJs cadastrados com regime, atividade, endereço e sócios.',
  },
  {
    icon: CalendarClock,
    rotulo: 'Obrigações do mês geradas',
    fonte: 'Agenda inteligente',
    texto: 'DAS, FGTS, eSocial, DCTFWeb e EFD-Reinf por cliente, com feriados.',
  },
  {
    icon: Sparkles,
    rotulo: 'IA montou a semana',
    fonte: 'Genesis IA',
    texto: 'Segunda: eSocial de 9 clientes · Terça: DCTFWeb · Quarta: DAS.',
  },
  {
    icon: FilePenLine,
    rotulo: 'Documento pronto',
    fonte: 'Modelos com IA',
    texto: 'Contrato de serviços contábeis redigido com os dados do cliente.',
  },
];

export default function FluxoAoVivo() {
  const [ativo, setAtivo] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setAtivo((a) => (a + 1) % (ETAPAS.length + 1)), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      <div className="absolute -inset-10 bg-[radial-gradient(closest-side,rgba(109,106,254,0.35),transparent)] blur-2xl" />
      <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#0b0d14]/90 shadow-[0_40px_120px_-20px_rgba(109,106,254,0.45)] backdrop-blur-xl">
        <div className="flex h-11 items-center justify-between border-b border-white/[0.06] px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
          <span className="flex items-center gap-2">
            <span className="lp-pulse h-2 w-2 rounded-full bg-[#c8ff4d]" /> ao vivo
          </span>
          <span>escritório no automático</span>
        </div>
        <div className="relative space-y-3 p-5">
          <div className="lp-scan pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#6d6afe]/15 to-transparent" />
          {ETAPAS.map((e, i) => {
            const feito = i < ativo;
            const agora = i === ativo;
            return (
              <div
                key={e.rotulo}
                className={`relative flex gap-4 rounded-2xl border p-4 transition-all duration-500 ${
                  agora
                    ? 'translate-x-1 border-[#6d6afe]/60 bg-[#6d6afe]/[0.08]'
                    : feito
                      ? 'border-white/[0.07] bg-white/[0.02]'
                      : 'border-white/[0.04] bg-transparent opacity-40'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    feito ? 'bg-[#c8ff4d] text-black' : agora ? 'bg-[#6d6afe] text-white' : 'bg-white/5 text-white/50'
                  }`}
                >
                  {feito ? <Check size={18} strokeWidth={3} /> : <e.icon size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-sm font-medium text-white">{e.rotulo}</p>
                    <p className="font-mono text-[11px] text-white/40">{e.fonte}</p>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug text-white/60">{e.texto}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
