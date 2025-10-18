/*
  Warnings:

  - You are about to drop the column `interviewId` on the `InterviewPayment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `InterviewPayment` DROP FOREIGN KEY `InterviewPayment_interviewId_fkey`;

-- DropIndex
DROP INDEX `InterviewPayment_interviewId_idx` ON `InterviewPayment`;

-- AlterTable
ALTER TABLE `InterviewPayment` DROP COLUMN `interviewId`;
