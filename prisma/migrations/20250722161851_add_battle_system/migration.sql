-- AlterTable
ALTER TABLE `users` ADD COLUMN `baseAttack` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `baseDefense` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `baseHp` INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN `beastsSlain` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `bossesSlain` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `beasts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `baseHp` INTEGER NOT NULL DEFAULT 100,
    `baseAttack` INTEGER NOT NULL DEFAULT 10,
    `baseDefense` INTEGER NOT NULL DEFAULT 5,
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'MYTHIC') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `beasts_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beast_loot_drops` (
    `id` VARCHAR(191) NOT NULL,
    `beastId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `dropRate` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `beast_loot_drops_beastId_itemId_key`(`beastId`, `itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `beast_loot_drops` ADD CONSTRAINT `beast_loot_drops_beastId_fkey` FOREIGN KEY (`beastId`) REFERENCES `beasts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beast_loot_drops` ADD CONSTRAINT `beast_loot_drops_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
