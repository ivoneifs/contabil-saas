-- CreateTable
CREATE TABLE "integracoes_config" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "focusNfeToken" TEXT,
    "focusNfeBaseUrl" TEXT,
    "asaasApiKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integracoes_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integracoes_config_organizationId_key" ON "integracoes_config"("organizationId");

-- AddForeignKey
ALTER TABLE "integracoes_config" ADD CONSTRAINT "integracoes_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
