-- CreateTable
CREATE TABLE `server_boss_defeats` (
    `id` VARCHAR(191) NOT NULL,
    `guildId` VARCHAR(191) NOT NULL,
    `bossName` VARCHAR(191) NOT NULL,
    `defeatedByUserId` VARCHAR(191) NOT NULL,
    `defeatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
