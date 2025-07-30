/*
  Warnings:

  - You are about to drop the `maps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_maps` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `brushes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `user_maps` DROP FOREIGN KEY `user_maps_mapId_fkey`;

-- DropForeignKey
ALTER TABLE `user_maps` DROP FOREIGN KEY `user_maps_userId_fkey`;

-- AlterTable
ALTER TABLE `brushes` MODIFY `description` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `maps`;

-- DropTable
DROP TABLE `user_maps`;

-- CreateIndex
CREATE UNIQUE INDEX `brushes_name_key` ON `brushes`(`name`);

-- AddForeignKey
ALTER TABLE `user_brushes` ADD CONSTRAINT `user_brushes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
