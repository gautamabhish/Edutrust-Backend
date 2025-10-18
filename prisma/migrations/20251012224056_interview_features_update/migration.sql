/*
  Warnings:

  - You are about to drop the column `answeredQuestions` on the `InterviewSession` table. All the data in the column will be lost.
  - You are about to drop the column `tokenLimit` on the `InterviewSession` table. All the data in the column will be lost.
  - You are about to drop the column `tokenUsed` on the `InterviewSession` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuestions` on the `InterviewSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `InterviewSession` DROP COLUMN `answeredQuestions`,
    DROP COLUMN `tokenLimit`,
    DROP COLUMN `tokenUsed`,
    DROP COLUMN `totalQuestions`,
    ADD COLUMN `RemaingToken` INTEGER NOT NULL DEFAULT 5000,
    MODIFY `timeLimitMinutes` INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `TokenLeft` INTEGER NOT NULL DEFAULT 0;
