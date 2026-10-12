import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as forge from 'node-forge';
import { PrismaService } from '../prisma/prisma.service';
import { cifrar, cifrarTexto, decifrar, decifrarTexto } from '../common/cofre';

const MAX_PFX_BYTES = 64 * 1024;

const SELECT_PUBLICO = {
  id: true,
  clientId: true,
  titular: true,
  documento: true,
  emissor: true,
  validoDe: true,
  validoAte: true,
  createdAt: true,
  client: { select: { razaoSocial: true } },
} as const;

interface MetadadosCertificado {
  titular: string;
  documento: string | null;
  emissor: string | null;
  validoDe: Date;
  validoAte: Date;
}

// Lê o .pfx (PKCS#12) e extrai os dados do certificado do titular.
// Certificados ICP-Brasil trazem o documento no CN ("NOME:CNPJ") e/ou nas
// extensões otherName do subjectAltName.
export function lerPfx(pfx: Buffer, senha: string): MetadadosCertificado {
  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    const asn1 = forge.asn1.fromDer(forge.util.createBuffer(pfx.toString('binary')));
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, senha);
  } catch {
    throw new BadRequestException('Não foi possível abrir o certificado: arquivo inválido ou senha incorreta.');
  }

  const bags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [];
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ?? [];
  if (!keyBags.length) {
    throw new BadRequestException('O arquivo não contém a chave privada. Exporte o certificado A1 com a chave.');
  }

  // O certificado do titular é o que não é autoridade certificadora.
  const certs = bags.map((b) => b.cert).filter((c): c is forge.pki.Certificate => !!c);
  const cert =
    certs.find((c) => {
      const bc = c.getExtension('basicConstraints') as { cA?: boolean } | undefined;
      return !bc?.cA;
    }) ?? certs[0];
  if (!cert) {
    throw new BadRequestException('Nenhum certificado encontrado no arquivo.');
  }

  const cn = (cert.subject.getField('CN')?.value as string | undefined) ?? 'Sem nome';
  const [nome, docNoCn] = cn.split(':');
  const documento = docNoCn?.replace(/\D/g, '') || null;

  return {
    titular: nome.trim(),
    documento: documento && (documento.length === 14 || documento.length === 11) ? documento : null,
    emissor: (cert.issuer.getField('CN')?.value as string | undefined) ?? null,
    validoDe: cert.validity.notBefore,
    validoAte: cert.validity.notAfter,
  };
}

@Injectable()
export class CertificadosService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(organizationId: string, file: Express.Multer.File, senha: string, clientId?: string) {
    if (!file) throw new BadRequestException('Envie o arquivo .pfx ou .p12.');
    if (!senha) throw new BadRequestException('Informe a senha do certificado.');
    if (file.size > MAX_PFX_BYTES) throw new BadRequestException('Arquivo grande demais para um certificado A1.');

    if (clientId) {
      const client = await this.prisma.client.findFirst({ where: { id: clientId, organizationId } });
      if (!client) throw new NotFoundException('Cliente não encontrado.');
    }

    const meta = lerPfx(file.buffer, senha);
    if (meta.validoAte < new Date()) {
      throw new BadRequestException(`Certificado vencido em ${meta.validoAte.toLocaleDateString('pt-BR')}.`);
    }

    return this.prisma.certificadoDigital.create({
      data: {
        organizationId,
        clientId: clientId || null,
        ...meta,
        pfxCifrado: new Uint8Array(cifrar(file.buffer)),
        senhaCifrada: cifrarTexto(senha),
      },
      select: SELECT_PUBLICO,
    });
  }

  findAll(organizationId: string, clientId?: string) {
    return this.prisma.certificadoDigital.findMany({
      where: { organizationId, ...(clientId ? { clientId } : {}) },
      orderBy: { validoAte: 'asc' },
      select: SELECT_PUBLICO,
    });
  }

  async remove(organizationId: string, id: string) {
    const cert = await this.prisma.certificadoDigital.findFirst({ where: { id, organizationId } });
    if (!cert) throw new NotFoundException('Certificado não encontrado.');
    await this.prisma.certificadoDigital.delete({ where: { id } });
    return { ok: true };
  }

  // Para uso interno das integrações (mTLS com SERPRO, eSocial, SEFAZ).
  // Nunca expor por endpoint.
  async obterParaUso(organizationId: string, clientId: string | null) {
    const cert = await this.prisma.certificadoDigital.findFirst({
      where: { organizationId, clientId, validoAte: { gt: new Date() } },
      orderBy: { validoAte: 'desc' },
    });
    if (!cert) return null;
    return { pfx: decifrar(cert.pfxCifrado), senha: decifrarTexto(cert.senhaCifrada), documento: cert.documento };
  }
}
