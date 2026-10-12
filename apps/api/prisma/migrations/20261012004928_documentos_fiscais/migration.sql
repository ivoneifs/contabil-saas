-- CreateEnum
CREATE TYPE "ModeloDocFiscal" AS ENUM ('NFE', 'NFCE', 'CTE', 'CTEOS', 'MDFE', 'NFSE', 'EVENTO', 'DESCONHECIDO');

-- CreateEnum
CREATE TYPE "FormatoArquivoFiscal" AS ENUM ('XML', 'PDF');

-- CreateEnum
CREATE TYPE "DirecaoDocFiscal" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateTable
CREATE TABLE "documentos_fiscais" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT,
    "modelo" "ModeloDocFiscal" NOT NULL,
    "formato" "FormatoArquivoFiscal" NOT NULL,
    "direcao" "DirecaoDocFiscal",
    "chaveAcesso" TEXT,
    "numero" TEXT,
    "serie" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "emitenteDoc" TEXT,
    "emitenteNome" TEXT,
    "destinatarioDoc" TEXT,
    "destinatarioNome" TEXT,
    "valorTotal" DECIMAL(14,2),
    "naturezaOperacao" TEXT,
    "protocolo" TEXT,
    "situacao" TEXT,
    "descricaoEvento" TEXT,
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documentos_fiscais_organizationId_modelo_idx" ON "documentos_fiscais"("organizationId", "modelo");

-- CreateIndex
CREATE INDEX "documentos_fiscais_organizationId_chaveAcesso_idx" ON "documentos_fiscais"("organizationId", "chaveAcesso");

-- CreateIndex
CREATE INDEX "documentos_fiscais_organizationId_dataEmissao_idx" ON "documentos_fiscais"("organizationId", "dataEmissao");

-- CreateIndex
CREATE INDEX "documentos_fiscais_clientId_idx" ON "documentos_fiscais"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_fiscais_organizationId_hash_key" ON "documentos_fiscais"("organizationId", "hash");

-- AddForeignKey
ALTER TABLE "documentos_fiscais" ADD CONSTRAINT "documentos_fiscais_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
