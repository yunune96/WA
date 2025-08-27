/*
  Warnings:

  - You are about to drop the column `handledAt` on the `Connection_Request` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `Connection_Request` table. All the data in the column will be lost.
  - The `status` column on the `Connection_Request` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Connection_Request" DROP CONSTRAINT "Connection_Request_roomId_fkey";

-- DropIndex
DROP INDEX "Connection_Request_createdAt_idx";

-- DropIndex
DROP INDEX "Connection_Request_receiverId_status_idx";

-- DropIndex
DROP INDEX "Connection_Request_requesterId_status_idx";

-- AlterTable
ALTER TABLE "Connection_Request" DROP COLUMN "handledAt",
DROP COLUMN "roomId",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- DropEnum
DROP TYPE "InviteStatus";
