-- CreateEnum
CREATE TYPE "RagStatus" AS ENUM ('processing', 'completed', 'skipped', 'failed');

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "rag_status" "RagStatus";
