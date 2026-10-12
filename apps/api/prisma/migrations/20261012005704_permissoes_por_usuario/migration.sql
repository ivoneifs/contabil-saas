-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "personalizado" BOOLEAN NOT NULL DEFAULT false;
