-- CreateEnum
CREATE TYPE "DocumentoCategoria" AS ENUM ('NOTA_FISCAL', 'EXTRATO_BANCARIO', 'OUTRO');

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "categoria" "DocumentoCategoria" NOT NULL DEFAULT 'OUTRO',
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documentos_organizationId_idx" ON "documentos"("organizationId");

-- CreateIndex
CREATE INDEX "documentos_clientId_idx" ON "documentos"("clientId");

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
