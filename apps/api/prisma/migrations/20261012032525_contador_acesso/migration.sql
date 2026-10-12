-- AlterTable
ALTER TABLE "contadores" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "contadores" ADD CONSTRAINT "contadores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
