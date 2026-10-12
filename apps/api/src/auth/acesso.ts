// Regras de licença: um escritório só acessa o sistema se estiver ativo e
// dentro da validade definida pelo Super Admin.
export function motivoBloqueio(org: { ativa: boolean; acessoAte: Date | null }): string | null {
  if (!org.ativa) return 'O acesso deste escritório está suspenso. Fale com o suporte.';
  if (org.acessoAte && org.acessoAte < new Date()) {
    return `O acesso deste escritório venceu em ${org.acessoAte.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}. Fale com o suporte para renovar.`;
  }
  return null;
}
