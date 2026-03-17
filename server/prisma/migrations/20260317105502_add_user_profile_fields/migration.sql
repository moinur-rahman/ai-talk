-- AlterTable
ALTER TABLE "users" ADD COLUMN     "custom_instructions" TEXT,
ADD COLUMN     "display_name" VARCHAR(255),
ADD COLUMN     "work_description" VARCHAR(100);
