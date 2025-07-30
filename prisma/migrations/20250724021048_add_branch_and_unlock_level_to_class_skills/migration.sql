-- AlterTable
ALTER TABLE `class_skills` ADD COLUMN `branch` VARCHAR(191) NOT NULL DEFAULT 'General',
    ADD COLUMN `unlockLevel` INTEGER NOT NULL DEFAULT 1;
