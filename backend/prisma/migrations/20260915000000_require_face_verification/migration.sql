-- AlterTable: add requireFaceVerification toggle to organizations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='requireFaceVerification') THEN
    ALTER TABLE "organizations" ADD COLUMN "requireFaceVerification" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END$$;
