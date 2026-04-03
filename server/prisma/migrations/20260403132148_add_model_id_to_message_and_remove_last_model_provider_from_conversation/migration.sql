/*
  Warnings:

  - You are about to drop the column `last_model_id` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `last_provider_id` on the `conversations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "last_model_id",
DROP COLUMN "last_provider_id";

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "model_id" UUID;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
