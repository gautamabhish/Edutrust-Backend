-- CreateTable
CREATE TABLE `CreatorProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `expertise` VARCHAR(191) NOT NULL,
    `bio` VARCHAR(191) NOT NULL,
    `experiencePoint1` VARCHAR(191) NULL,
    `experiencePoint2` VARCHAR(191) NULL,
    `experiencePoint3` VARCHAR(191) NULL,
    `experiencePoint4` VARCHAR(191) NULL,
    `experiencePoint5` VARCHAR(191) NULL,
    `telegramLink` VARCHAR(191) NULL,
    `instagramLink` VARCHAR(191) NULL,
    `linkedinLink` VARCHAR(191) NULL,
    `portfolioLink` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',

    UNIQUE INDEX `CreatorProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CreatorProfile` ADD CONSTRAINT `CreatorProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
