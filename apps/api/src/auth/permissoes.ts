import { MembershipRole } from '@prisma/client';

// Catálogo de permissões do escritório. O administrador marca, por usuário,
// o que cada um pode fazer; sem personalização, vale o padrão do papel.
export const PERMISSOES = [
  { chave: 'clientes.ver', grupo: 'Clientes', nome: 'Ver clientes', descricao: 'Lista e ficha dos clientes.' },
  { chave: 'clientes.gerenciar', grupo: 'Clientes', nome: 'Incluir e editar clientes', descricao: 'Cadastro, edição e importação em lote.' },
  { chave: 'clientes.excluir', grupo: 'Clientes', nome: 'Excluir clientes', descricao: 'Apaga o cliente e tudo dele.' },
  { chave: 'fiscal.ver', grupo: 'Fiscal', nome: 'Ver notas e arquivo fiscal', descricao: 'Consultar e baixar XML e PDF.' },
  { chave: 'fiscal.enviar', grupo: 'Fiscal', nome: 'Enviar notas fiscais', descricao: 'Upload de XML/PDF e emissão de notas.' },
  { chave: 'fiscal.excluir', grupo: 'Fiscal', nome: 'Excluir notas fiscais', descricao: 'Apagar arquivos fiscais.' },
  { chave: 'obrigacoes', grupo: 'Rotina', nome: 'Obrigações e agenda', descricao: 'Kanban, agenda inteligente e compromissos.' },
  { chave: 'documentos', grupo: 'Rotina', nome: 'Documentos dos clientes', descricao: 'Enviar e baixar documentos.' },
  { chave: 'ia', grupo: 'Rotina', nome: 'Assistente e modelos com IA', descricao: 'Usar a IA e gerar documentos.' },
  { chave: 'pessoal', grupo: 'Departamentos', nome: 'Departamento pessoal', descricao: 'Funcionários dos clientes.' },
  { chave: 'financeiro', grupo: 'Departamentos', nome: 'Financeiro', descricao: 'Contas a pagar e receber.' },
  { chave: 'certificados', grupo: 'Administração', nome: 'Certificados digitais', descricao: 'Enviar e remover certificados A1.' },
  { chave: 'integracoes', grupo: 'Administração', nome: 'Integrações e configurações', descricao: 'Chaves de gateways e órgãos.' },
  { chave: 'equipe', grupo: 'Administração', nome: 'Gerenciar equipe', descricao: 'Criar usuários e definir permissões.' },
] as const;

export type Permissao = (typeof PERMISSOES)[number]['chave'];

export const TODAS: Permissao[] = PERMISSOES.map((p) => p.chave);

export const PADRAO_POR_PAPEL: Record<MembershipRole, Permissao[]> = {
  ADMIN: TODAS,
  // Contador: quase tudo, menos administração da equipe e das integrações.
  CONTADOR: TODAS.filter((p) => p !== 'equipe' && p !== 'integracoes'),
  ASSISTENTE: ['clientes.ver', 'fiscal.ver', 'fiscal.enviar', 'obrigacoes', 'documentos', 'ia'],
};

export function permissoesEfetivas(m: { role: MembershipRole; personalizado: boolean; permissoes: string[] }): Permissao[] {
  // Administrador sempre tem tudo (evita escritório sem ninguém com acesso).
  if (m.role === 'ADMIN') return TODAS;
  if (!m.personalizado) return PADRAO_POR_PAPEL[m.role];
  return m.permissoes.filter((p): p is Permissao => (TODAS as string[]).includes(p));
}
