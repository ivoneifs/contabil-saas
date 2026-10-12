-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "acessoAte" TIMESTAMP(3),
ADD COLUMN     "ativa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "plano" TEXT,
ADD COLUMN     "telefone" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;
