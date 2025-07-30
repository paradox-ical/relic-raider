/*
  Warnings:

  - The values [EPIC] on the enum `items_rarity` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `items` MODIFY `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'MYTHIC') NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `currentZone` VARCHAR(191) NULL DEFAULT 'Jungle Ruins';
