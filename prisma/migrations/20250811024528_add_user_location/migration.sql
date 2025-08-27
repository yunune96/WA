-- CreateTable
CREATE SCHEMA IF NOT EXISTS "main";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE "User_Location" (
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_Location_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "User_Location" ADD CONSTRAINT "User_Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
