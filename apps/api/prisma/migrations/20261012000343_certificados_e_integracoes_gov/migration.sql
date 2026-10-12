-- AlterTable
ALTER TABLE "integracoes_config" ADD COLUMN     "nuvemFiscalClientId" TEXT,
ADD COLUMN     "nuvemFiscalClientSecret" TEXT,
ADD COLUMN     "serproConsumerKey" TEXT,
ADD COLUMN     "serproConsumerSecret" TEXT;

-- CreateTable
CREATE TABLE "certificados_digitais" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT,
    "titular" TEXT NOT NULL,
    "documento" TEXT,
    "emissor" TEXT,
    "validoDe" TIMESTAMP(3) NOT NULL,
    "validoAte" TIMESTAMP(3) NOT NULL,
    "pfxCifrado" BYTEA NOT NULL,
    "senhaCifrada" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificados_digitais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "certificados_digitais_organizationId_idx" ON "certificados_digitais"("organizationId");

-- CreateIndex
CREATE INDEX "certificados_digitais_clientId_idx" ON "certificados_digitais"("clientId");

-- AddForeignKey
ALTER TABLE "certificados_digitais" ADD CONSTRAINT "certificados_digitais_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados_digitais" ADD CONSTRAINT "certificados_digitais_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
