-- CreateEnum
CREATE TYPE "ProvedorIa" AS ENUM ('OPENAI', 'ANTHROPIC');

-- CreateTable
CREATE TABLE "chaves_ia" (
    "id" TEXT NOT NULL,
    "provedor" "ProvedorIa" NOT NULL,
    "nome" TEXT NOT NULL,
    "chaveCifrada" TEXT NOT NULL,
    "final" TEXT NOT NULL,
    "modelo" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "ultimoTeste" TIMESTAMP(3),
    "ultimoErro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chaves_ia_pkey" PRIMARY KEY ("id")
);
