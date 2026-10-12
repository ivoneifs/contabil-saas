-- CreateEnum
CREATE TYPE "CategoriaCrc" AS ENUM ('CONTADOR', 'TECNICO');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "contadorId" TEXT;

-- CreateTable
CREATE TABLE "contadores" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "crcNumero" TEXT NOT NULL,
    "crcUf" TEXT NOT NULL,
    "categoria" "CategoriaCrc" NOT NULL DEFAULT 'CONTADOR',
    "email" TEXT,
    "telefone" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contadores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contadores_organizationId_cpf_key" ON "contadores"("organizationId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "contadores_organizationId_crcUf_crcNumero_key" ON "contadores"("organizationId", "crcUf", "crcNumero");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_contadorId_fkey" FOREIGN KEY ("contadorId") REFERENCES "contadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contadores" ADD CONSTRAINT "contadores_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
