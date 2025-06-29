-- CreateTable
CREATE TABLE `QuizPayment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `redeemRequest` BOOLEAN NOT NULL DEFAULT false,
    `settled` BOOLEAN NOT NULL DEFAULT false,
    `settledAt` DATETIME(3) NULL,

    INDEX `QuizPayment_quizId_idx`(`quizId`),
    INDEX `QuizPayment_userId_idx`(`userId`),
    INDEX `QuizPayment_settled_idx`(`settled`),
    UNIQUE INDEX `QuizPayment_paymentId_key`(`paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `QuizPayment` ADD CONSTRAINT `QuizPayment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizPayment` ADD CONSTRAINT `QuizPayment_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
