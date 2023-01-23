/*
  Warnings:

  - You are about to drop the column `prompt` on the `GoogleASRRequest` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `GoogleASRRequest` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `GoogleTTSRequest` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `GoogleTTSRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GoogleASRRequest" DROP COLUMN "prompt",
DROP COLUMN "response";

-- AlterTable
ALTER TABLE "GoogleTTSRequest" DROP COLUMN "prompt",
DROP COLUMN "response";
