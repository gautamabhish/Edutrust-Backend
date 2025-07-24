/*
  Warnings:

  - You are about to drop the `LearningPathQuiz` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `LearningPathQuiz` DROP FOREIGN KEY `LearningPathQuiz_learningPathId_fkey`;

-- DropForeignKey
ALTER TABLE `LearningPathQuiz` DROP FOREIGN KEY `LearningPathQuiz_quizId_fkey`;

-- AlterTable
ALTER TABLE `Quiz` MODIFY `thumbnailURL` VARCHAR(191) NOT NULL DEFAULT 'https://res.cloudinary.com/dcn4q3zt1/image/upload/pexels.jpg';

-- DropTable
DROP TABLE `LearningPathQuiz`;

-- CreateTable
CREATE TABLE `LearningPathItem` (
    `id` VARCHAR(191) NOT NULL,
    `learningPathId` VARCHAR(191) NOT NULL,
    `type` ENUM('QUIZ', 'ARTICLE', 'VIDEO', 'LINK') NOT NULL,
    `order` INTEGER NOT NULL,
    `quizId` VARCHAR(191) NULL,
    `resourceTitle` VARCHAR(191) NULL,
    `resourceUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LearningPathItem_learningPathId_order_idx`(`learningPathId`, `order`),
    UNIQUE INDEX `LearningPathItem_learningPathId_quizId_key`(`learningPathId`, `quizId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LearningPathItem` ADD CONSTRAINT `LearningPathItem_learningPathId_fkey` FOREIGN KEY (`learningPathId`) REFERENCES `LearningPath`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningPathItem` ADD CONSTRAINT `LearningPathItem_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
