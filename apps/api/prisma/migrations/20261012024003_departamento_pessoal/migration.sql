-- CreateEnum
CREATE TYPE "VinculoTrabalho" AS ENUM ('EMPREGADO', 'APRENDIZ', 'SOCIO', 'ESTAGIARIO');

-- CreateEnum
CREATE TYPE "StatusFolha" AS ENUM ('ABERTA', 'FECHADA');

-- CreateEnum
CREATE TYPE "TipoCalculoTrabalhista" AS ENUM ('FERIAS', 'RESCISAO', 'DECIMO_TERCEIRO');

-- CreateEnum
CREATE TYPE "StatusEventoEsocial" AS ENUM ('PENDENTE', 'ENVIADO', 'DISPENSADO');

-- AlterTable
ALTER TABLE "funcionarios" ADD COLUMN     "cbo" TEXT,
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "dependentesIrrf" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "jornadaMensal" INTEGER NOT NULL DEFAULT 220,
ADD COLUMN     "matricula" TEXT,
ADD COLUMN     "pensaoAlimenticia" DECIMAL(12,2),
ADD COLUMN     "pis" TEXT,
ADD COLUMN     "valeTransporte" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vinculo" "VinculoTrabalho" NOT NULL DEFAULT 'EMPREGADO';

-- CreateTable
CREATE TABLE "folhas_pagamento" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "status" "StatusFolha" NOT NULL DEFAULT 'ABERTA',
    "totalBruto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalInss" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalIrrf" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalFgts" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalLiquido" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fechadaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folhas_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_folha" (
    "id" TEXT NOT NULL,
    "folhaId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "lancamentos" JSONB NOT NULL,
    "resultado" JSONB NOT NULL,
    "bruto" DECIMAL(12,2) NOT NULL,
    "inss" DECIMAL(12,2) NOT NULL,
    "irrf" DECIMAL(12,2) NOT NULL,
    "fgts" DECIMAL(12,2) NOT NULL,
    "liquido" DECIMAL(12,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_folha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculos_trabalhistas" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "tipo" "TipoCalculoTrabalhista" NOT NULL,
    "parametros" JSONB NOT NULL,
    "resultado" JSONB NOT NULL,
    "liquido" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculos_trabalhistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_esocial" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "funcionarioId" TEXT,
    "evento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "prazo" TIMESTAMP(3) NOT NULL,
    "status" "StatusEventoEsocial" NOT NULL DEFAULT 'PENDENTE',
    "recibo" TEXT,
    "observacao" TEXT,
    "chave" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_esocial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folhas_pagamento_organizationId_competencia_idx" ON "folhas_pagamento"("organizationId", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "folhas_pagamento_clientId_competencia_key" ON "folhas_pagamento"("clientId", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "itens_folha_folhaId_funcionarioId_key" ON "itens_folha"("folhaId", "funcionarioId");

-- CreateIndex
CREATE INDEX "calculos_trabalhistas_organizationId_tipo_idx" ON "calculos_trabalhistas"("organizationId", "tipo");

-- CreateIndex
CREATE INDEX "eventos_esocial_organizationId_status_idx" ON "eventos_esocial"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_esocial_organizationId_chave_key" ON "eventos_esocial"("organizationId", "chave");

-- AddForeignKey
ALTER TABLE "folhas_pagamento" ADD CONSTRAINT "folhas_pagamento_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_folha" ADD CONSTRAINT "itens_folha_folhaId_fkey" FOREIGN KEY ("folhaId") REFERENCES "folhas_pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_folha" ADD CONSTRAINT "itens_folha_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculos_trabalhistas" ADD CONSTRAINT "calculos_trabalhistas_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_esocial" ADD CONSTRAINT "eventos_esocial_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
