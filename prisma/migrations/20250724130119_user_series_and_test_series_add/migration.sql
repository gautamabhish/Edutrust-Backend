/*
  Warnings:

  - You are about to drop the column `testSeriesId` on the `Quiz` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Quiz` DROP FOREIGN KEY `Quiz_testSeriesId_fkey`;

-- DropIndex
DROP INDEX `Quiz_testSeriesId_fkey` ON `Quiz`;

-- AlterTable
ALTER TABLE `Quiz` DROP COLUMN `testSeriesId`;

-- CreateTable
CREATE TABLE `LearningPathQuiz` (
    `id` VARCHAR(191) NOT NULL,
    `learningPathId` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,

    UNIQUE INDEX `LearningPathQuiz_learningPathId_quizId_key`(`learningPathId`, `quizId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LearningPathQuiz` ADD CONSTRAINT `LearningPathQuiz_learningPathId_fkey` FOREIGN KEY (`learningPathId`) REFERENCES `LearningPath`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningPathQuiz` ADD CONSTRAINT `LearningPathQuiz_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
