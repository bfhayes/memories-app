-- Memories — Family Photo Archive
-- Access model: per-Memory shared password (hashed) + "pick your name" contributors.
-- No accounts / no email. Contributors (identities who log in & edit) are DISTINCT from
-- people (tag subjects in photos).

CREATE TABLE `memories` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `year_label` text,                          -- "1938 – 2024", "Summers 1960–1989"
  `cover_tone` text NOT NULL DEFAULT '#9FA487',
  `cover_thumb_key` text,                     -- R2 key of a chosen cover thumbnail (optional)
  `password_hash` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `contributors` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `memory_id` integer NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  `name` text NOT NULL,
  `accent` text NOT NULL DEFAULT '#C4704F',
  `created_at` text NOT NULL,
  `last_seen_at` text NOT NULL
);
CREATE INDEX `contributors_memory` ON `contributors` (`memory_id`);

CREATE TABLE `photos` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `memory_id` integer NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  `r2_key` text NOT NULL,                     -- original (preserved untouched)
  `thumb_key` text NOT NULL,                  -- downsized for browsing
  `content_hash` text NOT NULL,               -- SHA-256 of original bytes (dup detection)
  `file_name` text,
  `file_size` integer,
  `content_type` text NOT NULL DEFAULT 'image/jpeg',
  `width` integer,
  `height` integer,
  `tone` text NOT NULL DEFAULT '#9FA487',     -- placeholder tone shown before the image loads
  `date_value` text,                          -- "1962" | "1962-06" | "1962-06-14" | approx token | free text
  `date_confidence` text NOT NULL DEFAULT 'unknown', -- exact|month-year|year|approx|unknown
  `date_label` text,                          -- display: "Around 1962", "June 1962"
  `date_sort` text,                           -- best-effort ISO for ordering
  `date_year` integer,                        -- numeric year for the Decade filter
  `location` text,
  `about` text,                               -- free-form "About this photo"
  `notes` text,
  `favorite` integer NOT NULL DEFAULT 0,
  `source` text NOT NULL DEFAULT 'Upload',
  `uploaded_by` integer REFERENCES contributors(id),
  `created_at` text NOT NULL,                 -- "Added"
  `updated_at` text NOT NULL
);
CREATE UNIQUE INDEX `photos_memory_hash` ON `photos` (`memory_id`, `content_hash`);
CREATE INDEX `photos_memory` ON `photos` (`memory_id`);
CREATE INDEX `photos_memory_created` ON `photos` (`memory_id`, `created_at`);

-- Known people per memory (drives suggested names + autocomplete)
CREATE TABLE `people` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `memory_id` integer NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  `name` text NOT NULL,
  `accent` text NOT NULL DEFAULT '#7A8B6F',
  `created_at` text NOT NULL
);
CREATE UNIQUE INDEX `people_memory_name` ON `people` (`memory_id`, `name`);

CREATE TABLE `photo_people` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `photo_id` integer NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  `person_id` integer NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  `created_at` text NOT NULL
);
CREATE UNIQUE INDEX `photo_people_unique` ON `photo_people` (`photo_id`, `person_id`);

CREATE TABLE `photo_tags` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `photo_id` integer NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  `tag` text NOT NULL,
  `created_at` text NOT NULL
);
CREATE UNIQUE INDEX `photo_tags_unique` ON `photo_tags` (`photo_id`, `tag`);

-- Attributed activity timeline (uploaders/editors only — drives "Contributors · who's helped")
CREATE TABLE `activity` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `memory_id` integer NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  `photo_id` integer REFERENCES photos(id) ON DELETE CASCADE,
  `contributor_id` integer REFERENCES contributors(id),
  `contributor_name` text NOT NULL,           -- denormalized snapshot
  `accent` text NOT NULL DEFAULT '#C4704F',
  `action` text NOT NULL,                     -- uploaded|set_date|added_person|set_location|set_about|set_notes|added_tag|favorited|unfavorited
  `detail` text NOT NULL,                     -- "uploaded this photo", "tagged the location"…
  `created_at` text NOT NULL
);
CREATE INDEX `activity_photo` ON `activity` (`photo_id`, `created_at`);
CREATE INDEX `activity_memory` ON `activity` (`memory_id`, `created_at`);
