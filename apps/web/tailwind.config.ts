import type { Config } from "tailwindcss";

const paleta = (nome: string) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((t) => [t, `rgb(var(--${nome}-${t}) / <alpha-value>)`]),
  );

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Cores do tema, definidas pelo Super Admin (src/lib/tema.ts).
        indigo: paleta("brand"),
        violet: paleta("accent"),
      },
    },
  },
  plugins: [],
};
export default config;
