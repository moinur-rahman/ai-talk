-- CreateEnum
CREATE TYPE "TokenSource" AS ENUM ('api', 'estimated');

-- CreateTable
CREATE TABLE "model_pricing" (
    "id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "input_token_price" DECIMAL(10,6) NOT NULL,
    "output_token_price" DECIMAL(10,6) NOT NULL,
    "reasoning_token_price" DECIMAL(10,6),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "model_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_usage" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "model_pricing_id" UUID NOT NULL,
    "provider_name" VARCHAR(50) NOT NULL,
    "model_name" VARCHAR(100) NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "reasoning_tokens" INTEGER,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "input_cost" DECIMAL(12,8) NOT NULL,
    "output_cost" DECIMAL(12,8) NOT NULL,
    "reasoning_cost" DECIMAL(12,8),
    "total_cost" DECIMAL(12,8) NOT NULL,
    "token_source" "TokenSource" NOT NULL DEFAULT 'api',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "model_pricing_model_id_key" ON "model_pricing"("model_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_usage_message_id_key" ON "message_usage"("message_id");

-- CreateIndex
CREATE INDEX "idx_message_usage_created_at" ON "message_usage"("created_at");

-- AddForeignKey
ALTER TABLE "model_pricing" ADD CONSTRAINT "model_pricing_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_usage" ADD CONSTRAINT "message_usage_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_usage" ADD CONSTRAINT "message_usage_model_pricing_id_fkey" FOREIGN KEY ("model_pricing_id") REFERENCES "model_pricing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
