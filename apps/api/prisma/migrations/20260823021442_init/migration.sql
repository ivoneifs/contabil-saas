-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('ADMIN', 'CONTADOR', 'ASSISTENTE');

-- CreateEnum
CREATE TYPE "RegimeTributario" AS ENUM ('MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- CreateEnum
CREATE TYPE "NotaFiscalTipo" AS ENUM ('NFE', 'NFCE');

-- CreateEnum
CREATE TYPE "NotaFiscalStatus" AS ENUM ('RASCUNHO', 'ENVIADA', 'AUTORIZADA', 'REJEITADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "LancamentoTipo" AS ENUM ('A_PAGAR', 'A_RECEBER');

-- CreateEnum
CREATE TYPE "LancamentoStatus" AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'ASSISTENTE',
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpjCpf" TEXT NOT NULL,
    "regimeTributario" "RegimeTributario",
    "uf" TEXT NOT NULL,
    "municipio" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tipo" "NotaFiscalTipo" NOT NULL,
    "status" "NotaFiscalStatus" NOT NULL DEFAULT 'RASCUNHO',
    "numero" TEXT,
    "serie" TEXT,
    "uf" TEXT NOT NULL,
    "chaveAcesso" TEXT,
    "gatewayProvider" TEXT,
    "gatewayExternalId" TEXT,
    "xmlUrl" TEXT,
    "danfeUrl" TEXT,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "motivoRejeicao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamentos" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tipo" "LancamentoTipo" NOT NULL,
    "status" "LancamentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pagoEm" TIMESTAMP(3),
    "boletoUrl" TEXT,
    "asaasChargeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lancamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cargo" TEXT,
    "salarioBase" DECIMAL(12,2) NOT NULL,
    "dataAdmissao" TIMESTAMP(3) NOT NULL,
    "dataDemissao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cnpj_key" ON "organizations"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organizationId_userId_key" ON "memberships"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "clients_organizationId_idx" ON "clients"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_organizationId_cnpjCpf_key" ON "clients"("organizationId", "cnpjCpf");

-- CreateIndex
CREATE INDEX "notas_fiscais_organizationId_idx" ON "notas_fiscais"("organizationId");

-- CreateIndex
CREATE INDEX "notas_fiscais_clientId_idx" ON "notas_fiscais"("clientId");

-- CreateIndex
CREATE INDEX "lancamentos_organizationId_idx" ON "lancamentos"("organizationId");

-- CreateIndex
CREATE INDEX "lancamentos_clientId_idx" ON "lancamentos"("clientId");

-- CreateIndex
CREATE INDEX "funcionarios_organizationId_idx" ON "funcionarios"("organizationId");

-- CreateIndex
CREATE INDEX "funcionarios_clientId_idx" ON "funcionarios"("clientId");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
