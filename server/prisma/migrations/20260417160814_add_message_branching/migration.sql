-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "active_leaf_message_id" UUID;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "parent_message_id" UUID;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_active_leaf_message_id_fkey" FOREIGN KEY ("active_leaf_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
