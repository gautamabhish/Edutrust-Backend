-- AlterTable
ALTER TABLE `Referral` ADD COLUMN `redeemed` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `ReferralToken` (
    `token` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `referrerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReferralToken` ADD CONSTRAINT `ReferralToken_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferralToken` ADD CONSTRAINT `ReferralToken_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
