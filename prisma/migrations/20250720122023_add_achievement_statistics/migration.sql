-- AlterTable
ALTER TABLE `user_achievements` ADD COLUMN `firstProgressAt` DATETIME(3) NULL,
    ADD COLUMN `lastProgressAt` DATETIME(3) NULL;
