/*
  Warnings:

  - Made the column `thumbnailURL` on table `Quiz` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Quiz` MODIFY `thumbnailURL` VARCHAR(191) NOT NULL DEFAULT 'https://res.cloudinary.com/dcn4q3zt1/image/upload/v1748680038/pexels-leeloothefirst-5428830_tmxie9.jpg';
