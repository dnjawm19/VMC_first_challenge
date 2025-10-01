-- 0004_update_campaigns_thumbnail_url.sql
-- Add thumbnail URL column for campaigns to align with application queries

BEGIN;

ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS thumbnail_url text;

COMMIT;
