'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { CONFIG_PADRAO, aplicarTema, type ConfigPlataforma } from './tema';

const CHAVE = 'plataforma';

function doCache(): ConfigPlataforma | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return bruto ? { ...CONFIG_PADRAO, ...JSON.parse(bruto) } : null;
  } catch {
    return null;
  }
}

// Carrega nome e cores da plataforma e aplica o tema. Usa a última versão
// guardada no navegador para não piscar a cor padrão a cada carregamento.
export function usePlataforma() {
  const [cfg, setCfg] = useState<ConfigPlataforma>(CONFIG_PADRAO);

  useEffect(() => {
    const cache = doCache();
    if (cache) {
      setCfg(cache);
      aplicarTema(cache);
    }
    apiFetch<ConfigPlataforma>('/plataforma/config')
      .then((c) => {
        const completo = { ...CONFIG_PADRAO, ...c };
        setCfg(completo);
        aplicarTema(completo);
        try {
          window.localStorage.setItem(CHAVE, JSON.stringify(completo));
        } catch {
          // navegador sem armazenamento: só não guarda o cache
        }
      })
      .catch(() => undefined);
  }, []);

  return cfg;
}

export function lembrarPlataforma(c: ConfigPlataforma) {
  aplicarTema(c);
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(c));
  } catch {
    // ignora
  }
}
