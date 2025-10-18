/*
  Warnings:

  - Added the required column `role` to the `InterviewSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `InterviewSession` ADD COLUMN `role` VARCHAR(191) NOT NULL,
    ADD COLUMN `timeLimitMinutes` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `tokenLimit` INTEGER NOT NULL DEFAULT 5000,
    ADD COLUMN `tokenUsed` INTEGER NOT NULL DEFAULT 0;
