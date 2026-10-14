'use client';

import { useState } from "react";
import { ArrowRight } from "lucide-react";

// Custo do sistema vem da Aparência (preço à vista). Hipótese conservadora:
// o sistema poupa metade das horas informadas.
const ECONOMIA = 0.5;

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Faixa({
  rotulo,
  valor,
  exibido,
  min,
  max,
  passo,
  onChange,
}: {
  rotulo: string;
  valor: number;
  exibido: string;
  min: number;
  max: number;
  passo: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4 text-sm text-white/75">
        {rotulo}
        <b className="nx-display text-lg font-semibold text-white">{exibido}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="nx-range mt-3"
      />
    </label>
  );
}

export default function Calculadora({ cadastro, whatsapp, preco }: { cadastro: string; whatsapp: string; preco: number }) {
  const [clientes, setClientes] = useState(40);
  const [horas, setHoras] = useState(3);
  const [valorHora, setValorHora] = useState(80);
  const PLANO = preco;

  const horasMes = Math.round(clientes * horas);
  const custoMes = Math.round(horasMes * valorHora);
  // Em quantos dias o trabalho manual evitado paga o plano.
  const diasRetorno = Math.max(1, Math.ceil((PLANO / (custoMes * ECONOMIA)) * 30));

  return (
    <div className="nx-frame nx-card grid overflow-hidden rounded-3xl lg:grid-cols-2">
      <div className="space-y-8 p-7 sm:p-10">
        <Faixa
          rotulo="Clientes na carteira"
          valor={clientes}
          exibido={String(clientes)}
          min={5}
          max={400}
          passo={5}
          onChange={setClientes}
        />
        <Faixa
          rotulo="Horas por mês, por cliente, em agenda, guias, folha e conferência"
          valor={horas}
          exibido={`${horas} h`}
          min={1}
          max={12}
          passo={1}
          onChange={setHoras}
        />
        <Faixa
          rotulo="Custo de uma hora da equipe"
          valor={valorHora}
          exibido={brl(valorHora)}
          min={30}
          max={400}
          passo={10}
          onChange={setValorHora}
        />
        <p className="text-xs leading-relaxed text-[var(--nx-mute)]">
          Estimativa feita só com os números que você informou. Não inclui multas por atraso.
        </p>
      </div>

      <div className="relative flex flex-col justify-between gap-8 border-t border-[var(--nx-line)] bg-[radial-gradient(circle_at_70%_0%,rgba(62,240,255,0.14),transparent_60%)] p-7 sm:p-10 lg:border-l lg:border-t-0">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--nx-amber)]">
            Custo do trabalho manual
          </p>
          <p className="nx-display mt-3 text-[clamp(2.6rem,6vw,4.2rem)] font-semibold leading-none text-white">
            {brl(custoMes)}
            <span className="ml-2 text-base font-normal text-[var(--nx-mute)]">/mês</span>
          </p>
          <p className="mt-3 text-white/70">
            São <b className="text-white">{horasMes} horas por mês</b> da equipe em agenda, guias, cálculos e
            conferência, boa parte delas automatizável.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--nx-cyan)]/30 bg-[var(--nx-cyan)]/[0.06] p-5">
          <p className="text-sm text-white/70">Plano Pro: {brl(PLANO)} à vista</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="text-sm text-white/80">poupando metade desse tempo, ele se paga em</span>
            <span className="nx-display text-3xl font-semibold text-[var(--nx-cyan)]">
              {diasRetorno} {diasRetorno === 1 ? "dia" : "dias"}
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={cadastro} target="_blank" rel="noopener noreferrer" className="nx-btn inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold">
            Ver demonstração <ArrowRight size={17} />
          </a>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="nx-btn-wa inline-flex flex-1 items-center justify-center rounded-xl px-6 py-3.5 font-medium"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
