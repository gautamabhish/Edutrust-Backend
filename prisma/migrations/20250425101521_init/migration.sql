/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Question` table. All the data in the column will be lost.
  - Added the required column `duration` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Question` DROP COLUMN `imageUrl`,
    ADD COLUMN `attachmentURL` VARCHAR(191) NULL,
    ADD COLUMN `correctFileURL` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Quiz` ADD COLUMN `backtrack` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `duration` INTEGER NOT NULL,
    ADD COLUMN `randomize` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `thumbnailURL` VARCHAR(191) NULL DEFAULT '';

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('Default', 'Admin', 'SuperAdmin') NOT NULL DEFAULT 'Default';
