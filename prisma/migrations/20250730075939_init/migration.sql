CREATE TABLE "main"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "main"."Hobby" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Hobby_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "main"."User_Hobbies" (
    "userId" TEXT NOT NULL,
    "hobbyId" INTEGER NOT NULL,

    CONSTRAINT "User_Hobbies_pkey" PRIMARY KEY ("userId","hobbyId")
);

CREATE TABLE "main"."Connection_Request" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_Request_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "main"."Chat_Room" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_Room_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "main"."Chat_Room_Participant" (
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_Room_Participant_pkey" PRIMARY KEY ("userId","roomId")
);

CREATE TABLE "main"."Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "main"."User"("email");

CREATE UNIQUE INDEX "Hobby_name_key" ON "main"."Hobby"("name");

ALTER TABLE "main"."User_Hobbies" ADD CONSTRAINT "User_Hobbies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "main"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "main"."User_Hobbies" ADD CONSTRAINT "User_Hobbies_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "main"."Hobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "main"."Connection_Request" ADD CONSTRAINT "Connection_Request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "main"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "main"."Connection_Request" ADD CONSTRAINT "Connection_Request_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "main"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "main"."Chat_Room_Participant" ADD CONSTRAINT "Chat_Room_Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "main"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "main"."Chat_Room_Participant" ADD CONSTRAINT "Chat_Room_Participant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "main"."Chat_Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "main"."Message" ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "main"."Chat_Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "main"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "main"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
