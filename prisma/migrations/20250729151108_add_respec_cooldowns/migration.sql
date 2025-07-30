-- AlterTable
ALTER TABLE `users` ADD COLUMN `lastActiveRespecTime` DATETIME(3) NULL,
    ADD COLUMN `lastPassiveRespecTime` DATETIME(3) NULL,
    ADD COLUMN `lastUltimateRespecTime` DATETIME(3) NULL;
