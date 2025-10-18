-- CreateTable
CREATE TABLE `InterviewSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `status` ENUM('STARTED', 'COMPLETED', 'ABANDONED', 'TIMED_OUT') NOT NULL DEFAULT 'STARTED',

    INDEX `InterviewSession_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InterviewPayment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `interviewId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `settled` BOOLEAN NOT NULL DEFAULT false,
    `settledAt` DATETIME(3) NULL,

    INDEX `InterviewPayment_userId_idx`(`userId`),
    INDEX `InterviewPayment_interviewId_idx`(`interviewId`),
    INDEX `InterviewPayment_settled_idx`(`settled`),
    UNIQUE INDEX `InterviewPayment_paymentId_key`(`paymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InterviewSession` ADD CONSTRAINT `InterviewSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterviewPayment` ADD CONSTRAINT `InterviewPayment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterviewPayment` ADD CONSTRAINT `InterviewPayment_interviewId_fkey` FOREIGN KEY (`interviewId`) REFERENCES `InterviewSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
