-- Per-contributor likes ("loves"). Replaces the single global `favorite` flag with attributed
-- likes so a photo can accumulate multiple loves and we can surface the family's favorites.
-- (The old `photos.favorite` column is left in place but no longer used.)

CREATE TABLE `photo_likes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `photo_id` integer NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  `contributor_id` integer NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  `created_at` text NOT NULL
);
CREATE UNIQUE INDEX `photo_likes_unique` ON `photo_likes` (`photo_id`, `contributor_id`);
CREATE INDEX `photo_likes_photo` ON `photo_likes` (`photo_id`);
CREATE INDEX `photo_likes_contributor` ON `photo_likes` (`contributor_id`);
