-- Clean up duplicate brushes by removing old brush names
DELETE FROM `brushes` WHERE `name` IN (
  'Straw Brush',
  'Horsehair Brush', 
  'Sable Brush',
  'Archaeologist\'s Brush',
  'Precision Brush',
  'Master\'s Brush',
  'Ancient Brush',
  'Legendary Brush'
);

-- Update the first brush to be free (price = 0)
UPDATE `brushes` SET `price` = 0 WHERE `name` = 'Frayed Straw Brush';

-- Give all users the free Frayed Straw Brush if they don't have it
INSERT IGNORE INTO `user_brushes` (`id`, `userId`, `brushId`, `createdAt`)
SELECT 
  UUID() as `id`,
  u.`id` as `userId`,
  b.`id` as `brushId`,
  NOW() as `createdAt`
FROM `users` u
CROSS JOIN `brushes` b
WHERE b.`name` = 'Frayed Straw Brush'
AND NOT EXISTS (
  SELECT 1 FROM `user_brushes` ub 
  WHERE ub.`userId` = u.`id` 
  AND ub.`brushId` = b.`id`
); 