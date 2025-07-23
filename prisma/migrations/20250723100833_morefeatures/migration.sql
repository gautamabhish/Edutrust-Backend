/*
  Warnings:

  - The primary key for the `UserTestSeries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `A` on the `UserTestSeries` table. All the data in the column will be lost.
  - You are about to drop the column `B` on the `UserTestSeries` table. All the data in the column will be lost.
  - You are about to drop the `TestSeries` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `attemptNumber` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testSeriesId` to the `UserTestSeries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `UserTestSeries` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Quiz` DROP FOREIGN KEY `Quiz_testSeriesId_fkey`;

-- DropForeignKey
ALTER TABLE `UserTestSeries` DROP FOREIGN KEY `UserTestSeries_A_fkey`;

-- DropForeignKey
ALTER TABLE `UserTestSeries` DROP FOREIGN KEY `UserTestSeries_B_fkey`;

-- DropIndex
DROP INDEX `UserTestSeries_B_fkey` ON `UserTestSeries`;

-- AlterTable
ALTER TABLE `Question` ADD COLUMN `explanation` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `QuizAttempt` ADD COLUMN `attemptNumber` INTEGER NOT NULL,
    ADD COLUMN `status` ENUM('STARTED', 'COMPLETED', 'ABANDONED', 'TIMED_OUT') NOT NULL DEFAULT 'STARTED';

-- AlterTable
ALTER TABLE `UserTestSeries` DROP PRIMARY KEY,
    DROP COLUMN `A`,
    DROP COLUMN `B`,
    ADD COLUMN `testSeriesId` VARCHAR(191) NOT NULL,
    ADD COLUMN `userId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`testSeriesId`, `userId`);

-- DropTable
DROP TABLE `TestSeries`;

-- CreateTable
CREATE TABLE `LearningPath` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttemptAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `selected` JSON NOT NULL,
    `correct` BOOLEAN NOT NULL,

    INDEX `AttemptAnswer_attemptId_idx`(`attemptId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizDiscussion` (
    `id` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuizDiscussion_quizId_idx`(`quizId`),
    INDEX `QuizDiscussion_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserXP` (
    `userId` VARCHAR(191) NOT NULL,
    `xp` INTEGER NOT NULL DEFAULT 0,
    `streak` INTEGER NOT NULL DEFAULT 0,
    `lastQuizDate` DATETIME(3) NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserBadge` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `badgeName` VARCHAR(191) NOT NULL,
    `earnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AttemptAnswer` ADD CONSTRAINT `AttemptAnswer_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `QuizAttempt`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttemptAnswer` ADD CONSTRAINT `AttemptAnswer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTestSeries` ADD CONSTRAINT `UserTestSeries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTestSeries` ADD CONSTRAINT `UserTestSeries_testSeriesId_fkey` FOREIGN KEY (`testSeriesId`) REFERENCES `LearningPath`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quiz` ADD CONSTRAINT `Quiz_testSeriesId_fkey` FOREIGN KEY (`testSeriesId`) REFERENCES `LearningPath`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizDiscussion` ADD CONSTRAINT `QuizDiscussion_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizDiscussion` ADD CONSTRAINT `QuizDiscussion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserXP` ADD CONSTRAINT `UserXP_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBadge` ADD CONSTRAINT `UserBadge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
