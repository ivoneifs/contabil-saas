'use client';

import { useEffect, useState } from "react";
import { CalendarClock, Sparkles, Calculator, ShieldAlert, Check } from "lucide-react";

// Demonstração do ciclo do mês: obrigações → IA → folha → alertas.
const ETAPAS = [
  { icon: CalendarClock, rotulo: "Obrigações do mês geradas", fonte: "48 clientes · 07:00", texto: "DAS, FGTS, DCTFWeb, EFD-Reinf e eSocial com prazo legal" },
  { icon: Sparkles, rotulo: "IA montou a semana", fonte: "Genesis IA", texto: "Trabalho distribuído entre a equipe por prioridade" },
  { icon: Calculator, rotulo: "Folha calculada", fonte: "Tabelas 2026", texto: "INSS, IRRF e FGTS de 312 funcionários" },
  { icon: ShieldAlert, rotulo: "Alerta preventivo", fonte: "Cofre A1", texto: "Certificado da Padaria Pão Bom vence em 15 dias" },
];

// Posições dos sinais no radar (% do diâmetro) e o atraso de cada um.
const BLIPS = [
  { x: 68, y: 30, d: 0.4, ambar: false },
  { x: 30, y: 38, d: 1.6, ambar: true },
  { x: 58, y: 70, d: 2.5, ambar: false },
  { x: 24, y: 66, d: 3.3, ambar: false },
  { x: 78, y: 58, d: 1.0, ambar: true },
];

export default function RadarHud() {
  const [ativo, setAtivo] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setAtivo((a) => (a + 1) % (ETAPAS.length + 1)), 1900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative nx-float">
      <div className="absolute -inset-12 bg-[radial-gradient(closest-side,rgba(62,240,255,0.22),transparent)] blur-2xl" />
      <div className="nx-frame nx-card relative overflow-hidden rounded-2xl shadow-[0_40px_140px_-30px_rgba(43,107,255,0.6)]">
        {/* barra de status */}
        <div className="flex h-10 items-center justify-between border-b border-[var(--nx-line)] px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--nx-mute)]">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="nx-ping absolute inline-flex h-full w-full rounded-full bg-[var(--nx-cyan)]" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--nx-cyan)]" />
            </span>
            monitor fiscal · online
          </span>
          <span className="hidden sm:inline">varredura contínua · demo</span>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[200px_1fr]">
          {/* radar */}
          <div className="relative mx-auto aspect-square w-[200px]">
            <div className="absolute inset-0 rounded-full border border-[var(--nx-cyan)]/30 bg-[radial-gradient(circle,rgba(62,240,255,0.08),transparent_70%)]" />
            <div className="absolute inset-[16%] rounded-full border border-[var(--nx-cyan)]/20" />
            <div className="absolute inset-[33%] rounded-full border border-[var(--nx-cyan)]/15" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--nx-cyan)]/15" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-[var(--nx-cyan)]/15" />
            <div className="nx-sweep absolute inset-0 rounded-full" />
            {BLIPS.map((b, i) => (
              <span
                key={i}
                className="nx-blip absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  animationDelay: `${b.d}s`,
                  background: b.ambar ? "var(--nx-amber)" : "var(--nx-cyan)",
                  boxShadow: `0 0 12px ${b.ambar ? "var(--nx-amber)" : "var(--nx-cyan)"}`,
                }}
              />
            ))}
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_#fff]" />
          </div>

          {/* log de eventos */}
          <div className="min-w-0 space-y-2">
            {ETAPAS.map((e, i) => {
              const feito = i < ativo;
              const agora = i === ativo;
              return (
                <div
                  key={e.rotulo}
                  className={`flex gap-3 rounded-xl border p-3 transition-all duration-500 ${
                    agora
                      ? "translate-x-1 border-[var(--nx-cyan)]/60 bg-[var(--nx-cyan)]/[0.07] shadow-[0_0_30px_-10px_rgba(62,240,255,0.6)]"
                      : feito
                        ? "border-white/[0.07] bg-white/[0.02]"
                        : "border-transparent opacity-35"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      feito ? "bg-[var(--nx-cyan)] text-black" : agora ? "bg-[var(--nx-blue)] text-white" : "bg-white/5 text-white/50"
                    }`}
                  >
                    {feito ? <Check size={15} strokeWidth={3} /> : <e.icon size={15} />}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] font-medium text-white">
                      {e.rotulo}
                      <span className="font-mono text-[10px] text-white/40">{e.fonte}</span>
                    </p>
                    <p className="truncate text-[12px] text-white/55">{e.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* telemetria */}
        <div className="grid grid-cols-3 border-t border-[var(--nx-line)] font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--nx-mute)]">
          {[
            ["obrigações", "214"],
            ["entregues", "167"],
            ["alertas", "6"],
          ].map(([k, v], i) => (
            <div key={k} className={`px-4 py-3 ${i ? "border-l border-[var(--nx-line)]" : ""}`}>
              <p className="nx-display text-xl font-semibold tracking-normal text-white">{v}</p>
              {k} no mês
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
