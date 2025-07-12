/*
  Warnings:

  - The values [Admin] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('Default', 'Creator', 'SuperAdmin') NOT NULL DEFAULT 'Default';
