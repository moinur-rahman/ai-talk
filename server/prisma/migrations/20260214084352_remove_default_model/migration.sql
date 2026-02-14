/*
  Warnings:

  - You are about to drop the `default_models` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "default_models" DROP CONSTRAINT "default_models_model_id_fkey";

-- DropForeignKey
ALTER TABLE "default_models" DROP CONSTRAINT "default_models_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "default_models" DROP CONSTRAINT "default_models_user_id_fkey";

-- DropTable
DROP TABLE "default_models";
