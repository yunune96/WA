-- AlterTable
ALTER TABLE "Chat_Room_Participant" ADD COLUMN     "lastReadAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Chat_Room_Participant_roomId_idx" ON "Chat_Room_Participant"("roomId");

-- CreateIndex
CREATE INDEX "Message_roomId_createdAt_idx" ON "Message"("roomId", "createdAt");
