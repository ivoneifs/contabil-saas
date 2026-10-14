'use client';

import { useRef, useState } from "react";
import { Play } from "lucide-react";

export const VIDEO_TUTORIAL = "/videos/contabil-tutorial.mp4";

// Início de cada parte do vídeo (segundos).
const CAPITULOS = [
  { t: 22, titulo: "Acesso ao sistema" },
  { t: 39, titulo: "Painel do escritório" },
  { t: 73, titulo: "Importar clientes pelo CNPJ" },
  { t: 94, titulo: "Clientes" },
  { t: 116, titulo: "Agenda inteligente" },
  { t: 144, titulo: "Obrigações em kanban" },
  { t: 171, titulo: "Funcionários" },
  { t: 197, titulo: "Folha de pagamento" },
  { t: 229, titulo: "Férias, 13º e rescisões" },
  { t: 259, titulo: "Arquivo fiscal e certificados" },
  { t: 290, titulo: "Modelos com IA e índices" },
  { t: 317, titulo: "Equipe e permissões" },
];

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Vídeo tutorial com capítulos clicáveis. */
export default function VideoTutorial() {
  const video = useRef<HTMLVideoElement>(null);
  const [atual, setAtual] = useState(-1);

  const irPara = (t: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = t;
    v.play().catch(() => {});
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="nx-frame nx-card overflow-hidden rounded-2xl">
        <video
          ref={video}
          src={VIDEO_TUTORIAL}
          poster="/videos/contabil-tutorial.jpg"
          controls
          preload="metadata"
          playsInline
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            setAtual(CAPITULOS.findLastIndex((c) => t >= c.t));
          }}
          className="aspect-video w-full bg-black"
        />
      </div>
      <ol className="nx-card max-h-[420px] space-y-1 overflow-y-auto rounded-2xl p-3">
        <li className="px-2 pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--nx-mute)]">Capítulos</li>
        {CAPITULOS.map((c, i) => (
          <li key={c.t}>
            <button
              type="button"
              onClick={() => irPara(c.t)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
                i === atual ? "bg-[var(--nx-cyan)]/10 text-white" : "text-white/70 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span className="w-10 shrink-0 font-mono text-xs text-[var(--nx-cyan)]">{mmss(c.t)}</span>
              <span className="flex-1">{c.titulo}</span>
              {i === atual && <Play size={12} className="text-[var(--nx-cyan)]" />}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
