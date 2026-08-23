-- CreateEnum
CREATE TYPE "CompromissoStatus" AS ENUM ('AGENDADO', 'REALIZADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "compromissos" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "status" "CompromissoStatus" NOT NULL DEFAULT 'AGENDADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compromissos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compromissos_organizationId_idx" ON "compromissos"("organizationId");

-- CreateIndex
CREATE INDEX "compromissos_clientId_idx" ON "compromissos"("clientId");

-- CreateIndex
CREATE INDEX "compromissos_inicio_idx" ON "compromissos"("inicio");

-- AddForeignKey
ALTER TABLE "compromissos" ADD CONSTRAINT "compromissos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
