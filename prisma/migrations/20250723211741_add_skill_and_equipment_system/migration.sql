-- AlterTable
ALTER TABLE `users` ADD COLUMN `playerClass` VARCHAR(191) NULL DEFAULT 'Adventurer',
    ADD COLUMN `skillPoints` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `totalSkillPoints` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `player_classes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `baseHp` INTEGER NOT NULL DEFAULT 100,
    `baseAttack` INTEGER NOT NULL DEFAULT 10,
    `baseDefense` INTEGER NOT NULL DEFAULT 5,
    `hpPerLevel` INTEGER NOT NULL DEFAULT 10,
    `attackPerLevel` INTEGER NOT NULL DEFAULT 2,
    `defensePerLevel` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `player_classes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skills` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `type` ENUM('ACTIVE', 'PASSIVE', 'ULTIMATE') NOT NULL,
    `category` ENUM('COMBAT', 'EXPLORATION', 'CRAFTING', 'UTILITY') NOT NULL,
    `maxLevel` INTEGER NOT NULL DEFAULT 5,
    `baseEffect` DOUBLE NOT NULL DEFAULT 1.0,
    `effectPerLevel` DOUBLE NOT NULL DEFAULT 0.2,
    `energyCost` INTEGER NOT NULL DEFAULT 0,
    `cooldown` INTEGER NOT NULL DEFAULT 0,
    `requiredLevel` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `skills_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_skills` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `isPassive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `class_skills_classId_skillId_key`(`classId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_skills` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `learnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_skills_userId_skillId_key`(`userId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `type` ENUM('WEAPON', 'ARMOR', 'ACCESSORY', 'BOSS_GEAR') NOT NULL,
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'MYTHIC') NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `hpBonus` INTEGER NOT NULL DEFAULT 0,
    `attackBonus` INTEGER NOT NULL DEFAULT 0,
    `defenseBonus` INTEGER NOT NULL DEFAULT 0,
    `specialEffect` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `equipment_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipped_gear` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `equipmentId` VARCHAR(191) NOT NULL,
    `slot` ENUM('WEAPON', 'HEAD', 'CHEST', 'LEGS', 'FEET', 'ACCESSORY_1', 'ACCESSORY_2') NOT NULL,
    `equippedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `equipped_gear_userId_slot_key`(`userId`, `slot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `class_skills` ADD CONSTRAINT `class_skills_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `player_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_skills` ADD CONSTRAINT `class_skills_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_skills` ADD CONSTRAINT `user_skills_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_skills` ADD CONSTRAINT `user_skills_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipped_gear` ADD CONSTRAINT `equipped_gear_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipped_gear` ADD CONSTRAINT `equipped_gear_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `equipment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
