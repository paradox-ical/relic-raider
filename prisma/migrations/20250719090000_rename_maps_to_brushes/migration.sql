-- Create new brushes table
CREATE TABLE `brushes` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `multiplier` DOUBLE PRECISION NOT NULL,
  `price` INTEGER NOT NULL,
  `tier` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create new user_brushes table
CREATE TABLE `user_brushes` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `brushId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_brushes_userId_brushId_key`(`userId`, `brushId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraint
ALTER TABLE `user_brushes` ADD CONSTRAINT `user_brushes_brushId_fkey` FOREIGN KEY (`brushId`) REFERENCES `brushes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old tables if they exist (optional - you can comment these out if you want to keep the old data)
-- DROP TABLE IF EXISTS `user_maps`;
-- DROP TABLE IF EXISTS `maps`; 