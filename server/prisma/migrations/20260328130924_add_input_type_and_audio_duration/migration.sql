-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('text', 'voice');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "audio_duration_ms" INTEGER,
ADD COLUMN     "input_type" "InputType" NOT NULL DEFAULT 'text';
