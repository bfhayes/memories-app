-- Soft delete for photos: removing a photo now sets `deleted_at` instead of dropping the row +
-- R2 objects, so it can be restored. Also make the people unique index case-INSENSITIVE so a
-- COLLATE NOCASE lookup matches the index (prevents duplicate people differing only by case).

ALTER TABLE `photos` ADD COLUMN `deleted_at` text;

DROP INDEX `people_memory_name`;
CREATE UNIQUE INDEX `people_memory_name` ON `people` (`memory_id`, `name` COLLATE NOCASE);
