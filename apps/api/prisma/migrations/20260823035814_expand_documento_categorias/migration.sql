-- Expande as categorias de documentos com a taxonomia completa de documentos
-- contabeis (fiscais, financeiros, despesas, trabalhistas, tributarios).
-- Nao ha linhas usando o valor antigo NOTA_FISCAL nesta base, entao a
-- substituicao do enum e segura.

CREATE TYPE "DocumentoCategoria_new" AS ENUM (
  'NFE_ENTRADA',
  'NFE_SAIDA',
  'NFSE',
  'NFCE',
  'CTE',
  'XML_NOTA_FISCAL',
  'REDUCAO_Z_LEITURA_X',
  'SPED',
  'EXTRATO_BANCARIO',
  'EXTRATO_APLICACAO',
  'EXTRATO_CARTAO',
  'COMPROVANTE_PAGAMENTO',
  'CONTRATO_EMPRESTIMO',
  'DUPLICATA_BOLETO',
  'CONTROLE_RECEBIMENTO',
  'FATURA_ENERGIA',
  'FATURA_AGUA',
  'FATURA_TELEFONIA_INTERNET',
  'RECIBO_ALUGUEL',
  'COMPROVANTE_CONDOMINIO_IPTU',
  'FOLHA_PAGAMENTO',
  'GUIA_FGTS',
  'COMPROVANTE_PROLABORE',
  'RECIBO_FERIAS_RESCISAO',
  'RECIBO_AUTONOMO_RPA',
  'GUIA_DAS',
  'GUIA_DARF',
  'GUIA_ISS_ICMS',
  'CONTRATO_SOCIAL',
  'OUTRO'
);

ALTER TABLE "documentos"
  ALTER COLUMN "categoria" DROP DEFAULT,
  ALTER COLUMN "categoria" TYPE "DocumentoCategoria_new"
    USING (
      CASE "categoria"::text
        WHEN 'NOTA_FISCAL' THEN 'OUTRO'
        ELSE "categoria"::text
      END
    )::"DocumentoCategoria_new",
  ALTER COLUMN "categoria" SET DEFAULT 'OUTRO';

DROP TYPE "DocumentoCategoria";
ALTER TYPE "DocumentoCategoria_new" RENAME TO "DocumentoCategoria";
