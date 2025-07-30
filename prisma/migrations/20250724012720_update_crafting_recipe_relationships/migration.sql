-- AlterTable
ALTER TABLE `crafting_recipes` ADD COLUMN `resultEquipmentId` VARCHAR(191) NULL,
    MODIFY `resultItemId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `crafting_recipes` ADD CONSTRAINT `crafting_recipes_resultEquipmentId_fkey` FOREIGN KEY (`resultEquipmentId`) REFERENCES `equipment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
