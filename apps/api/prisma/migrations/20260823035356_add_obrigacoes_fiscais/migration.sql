-- CreateEnum
CREATE TYPE "ObrigacaoFiscalStatus" AS ENUM ('PENDENTE', 'EM_ANALISE', 'ENTREGUE');

-- CreateTable
CREATE TABLE "obrigacoes_fiscais" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "prazo" TIMESTAMP(3) NOT NULL,
    "status" "ObrigacaoFiscalStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obrigacoes_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "obrigacoes_fiscais_organizationId_idx" ON "obrigacoes_fiscais"("organizationId");

-- CreateIndex
CREATE INDEX "obrigacoes_fiscais_clientId_idx" ON "obrigacoes_fiscais"("clientId");

-- AddForeignKey
ALTER TABLE "obrigacoes_fiscais" ADD CONSTRAINT "obrigacoes_fiscais_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
