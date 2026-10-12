-- CreateTable
CREATE TABLE "configuracao_plataforma" (
    "id" TEXT NOT NULL DEFAULT 'plataforma',
    "nomeSistema" TEXT NOT NULL DEFAULT 'Genesis IA Contabilidade',
    "corPrimaria" TEXT NOT NULL DEFAULT '#6366f1',
    "corSecundaria" TEXT NOT NULL DEFAULT '#8b5cf6',
    "corDestaque" TEXT NOT NULL DEFAULT '#c8ff4d',
    "whatsapp" TEXT NOT NULL DEFAULT '5574988258825',
    "precoAVista" INTEGER NOT NULL DEFAULT 4000,
    "parcelas" INTEGER NOT NULL DEFAULT 10,
    "valorParcela" INTEGER NOT NULL DEFAULT 500,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracao_plataforma_pkey" PRIMARY KEY ("id")
);
