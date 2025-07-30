-- AlterTable
ALTER TABLE `users` ADD COLUMN `selectedBranch` VARCHAR(191) NULL,
    ADD COLUMN `tutorialCompleted` BOOLEAN NOT NULL DEFAULT false;
