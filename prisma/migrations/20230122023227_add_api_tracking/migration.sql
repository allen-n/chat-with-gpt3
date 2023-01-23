/*
  Warnings:

  - You are about to drop the `Example` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Example";

-- CreateTable
CREATE TABLE "OpenaiCompletionRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "apiPath" TEXT NOT NULL,
    "apiVersion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,

    CONSTRAINT "OpenaiCompletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleASRRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "apiPath" TEXT NOT NULL,
    "apiVersion" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "billableTimeSeconds" INTEGER NOT NULL,
    "billableTimeNanos" INTEGER,

    CONSTRAINT "GoogleASRRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleTTSRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "apiPath" TEXT NOT NULL,
    "apiVersion" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "billableSize" INTEGER NOT NULL,

    CONSTRAINT "GoogleTTSRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OpenaiCompletionRequest" ADD CONSTRAINT "OpenaiCompletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleASRRequest" ADD CONSTRAINT "GoogleASRRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleTTSRequest" ADD CONSTRAINT "GoogleTTSRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
