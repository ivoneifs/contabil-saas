// Paletas do tema a partir das cores escolhidas pelo Super Admin.
// O Tailwind lê "indigo" e "violet" de variáveis CSS (tailwind.config.ts),
// então trocar a cor aqui repinta o sistema inteiro.

export interface ConfigPlataforma {
  nomeSistema: string;
  corPrimaria: string;
  corSecundaria: string;
  corDestaque: string;
  whatsapp: string;
  precoAVista: number;
  parcelas: number;
  valorParcela: number;
}

export const CONFIG_PADRAO: ConfigPlataforma = {
  nomeSistema: 'Genesis IA Contabilidade',
  corPrimaria: '#6366f1',
  corSecundaria: '#8b5cf6',
  corDestaque: '#c8ff4d',
  whatsapp: '5574988258825',
  precoAVista: 4000,
  parcelas: 10,
  valorParcela: 500,
};

const TONS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
// Quanto misturar com branco (tons claros) ou preto (tons escuros).
const MISTURA: Record<number, [number, number]> = {
  50: [1, 0.93], 100: [1, 0.86], 200: [1, 0.72], 300: [1, 0.5], 400: [1, 0.25], 500: [0, 0],
  600: [-1, 0.14], 700: [-1, 0.28], 800: [-1, 0.42], 900: [-1, 0.54], 950: [-1, 0.72],
};

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function tom(hex: string, t: number) {
  const [dir, f] = MISTURA[t];
  const alvo = dir === 1 ? 255 : 0;
  return rgb(hex)
    .map((c) => Math.round(dir === 0 ? c : c + (alvo - c) * f))
    .join(' ');
}

// Cor do texto que vai sobre a cor de destaque (preto ou branco, pelo contraste).
function tinta(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '0 0 0' : '255 255 255';
}

export function variaveisTema(c: Pick<ConfigPlataforma, 'corPrimaria' | 'corSecundaria' | 'corDestaque'>) {
  const vars: Record<string, string> = {};
  for (const t of TONS) {
    vars[`--brand-${t}`] = tom(c.corPrimaria, t);
    vars[`--accent-${t}`] = tom(c.corSecundaria, t);
  }
  vars['--signal'] = rgb(c.corDestaque).join(' ');
  vars['--signal-ink'] = tinta(c.corDestaque);
  return vars;
}

export function cssTema(c: Pick<ConfigPlataforma, 'corPrimaria' | 'corSecundaria' | 'corDestaque'>) {
  return `:root{${Object.entries(variaveisTema(c))
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;
}

export function aplicarTema(c: Pick<ConfigPlataforma, 'corPrimaria' | 'corSecundaria' | 'corDestaque'>) {
  const raiz = document.documentElement;
  Object.entries(variaveisTema(c)).forEach(([k, v]) => raiz.style.setProperty(k, v));
}

export function formatarWhatsapp(n: string) {
  const d = n.replace(/\D/g, '').replace(/^55/, '');
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : n;
}
