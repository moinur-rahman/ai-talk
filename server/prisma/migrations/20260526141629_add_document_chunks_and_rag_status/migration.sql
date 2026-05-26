-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "RagStatus" AS ENUM ('processing', 'completed', 'skipped', 'failed');

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "rag_status" "RagStatus";

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "embedding" vector,
    "embedding_model" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_document_chunks_file_id" ON "document_chunks"("file_id");

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
