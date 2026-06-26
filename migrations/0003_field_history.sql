-- Restorable history for free-text/single-value fields. Edits are last-write-wins, but we record
-- the PREVIOUS value on every change so nothing is ever truly lost (it can be restored).

ALTER TABLE `activity` ADD COLUMN `field` text;       -- about | notes | location | date
ALTER TABLE `activity` ADD COLUMN `prev_value` text;  -- the value BEFORE this change (JSON for date)
