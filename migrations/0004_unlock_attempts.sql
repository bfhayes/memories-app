CREATE TABLE `unlock_attempts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `memory_id` integer NOT NULL,
  `ip` text NOT NULL,
  `created_at` text NOT NULL
);
CREATE INDEX `unlock_attempts_lookup` ON `unlock_attempts` (`memory_id`, `ip`, `created_at`);
