/*
  Warnings:

  - A unique constraint covering the columns `[userId,quizId]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Certificate_userId_quizId_key` ON `Certificate`(`userId`, `quizId`);
