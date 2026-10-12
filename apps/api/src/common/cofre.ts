import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

// Criptografia simétrica (AES-256-GCM) para segredos guardados no banco:
// certificados A1, senhas de certificado e chaves de APIs governamentais.
// A chave vem de COFRE_KEY; sem ela, deriva de JWT_SECRET para não quebrar
// ambientes existentes (trocar a chave invalida o que já foi cifrado).
function chave(): Buffer {
  const base = process.env.COFRE_KEY || process.env.JWT_SECRET;
  if (!base) {
    throw new Error('COFRE_KEY (ou JWT_SECRET) não configurado.');
  }
  return createHash('sha256').update(base).digest();
}

// Formato: iv(12) | tag(16) | dados
export function cifrar(dados: Buffer | string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', chave(), iv);
  const conteudo = Buffer.concat([cipher.update(dados), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), conteudo]);
}

export function decifrar(blob: Buffer | Uint8Array): Buffer {
  const buf = Buffer.from(blob);
  const decipher = createDecipheriv('aes-256-gcm', chave(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]);
}

export function cifrarTexto(texto: string): string {
  return cifrar(texto).toString('base64');
}

export function decifrarTexto(base64: string): string {
  return decifrar(Buffer.from(base64, 'base64')).toString('utf8');
}

export function mascarar(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 4) return '****';
  return `••••${value.slice(-4)}`;
}
