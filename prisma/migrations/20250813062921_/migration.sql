/*
  Warnings:

  - The `status` column on the `Connection_Request` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

-- AlterTable
ALTER TABLE "Connection_Request" ADD COLUMN     "handledAt" TIMESTAMP(3),
ADD COLUMN     "message" TEXT,
ADD COLUMN     "roomId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "Connection_Request_requesterId_status_idx" ON "Connection_Request"("requesterId", "status");

-- CreateIndex
CREATE INDEX "Connection_Request_receiverId_status_idx" ON "Connection_Request"("receiverId", "status");

-- CreateIndex
CREATE INDEX "Connection_Request_createdAt_idx" ON "Connection_Request"("createdAt");

-- AddForeignKey
ALTER TABLE "Connection_Request" ADD CONSTRAINT "Connection_Request_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Chat_Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
