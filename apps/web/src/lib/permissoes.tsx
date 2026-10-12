'use client';

import { createContext, useContext } from 'react';

export interface Eu {
  nome: string;
  email: string;
  papel: 'ADMIN' | 'CONTADOR' | 'ASSISTENTE';
  isSuperAdmin: boolean;
  permissoes: string[];
  escritorio: { id: string; name: string; acessoAte: string | null } | null;
}

export const EuContexto = createContext<Eu | null>(null);

// pode('clientes.excluir') -> boolean. Enquanto carrega, esconde ações.
export function usePode() {
  const eu = useContext(EuContexto);
  return (permissao?: string) => !permissao || !!eu?.isSuperAdmin || !!eu?.permissoes.includes(permissao);
}

export function useEu() {
  return useContext(EuContexto);
}
