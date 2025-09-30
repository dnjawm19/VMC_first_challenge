-- 0003_update_profiles_and_channels.sql
-- Update profile tables with additional fields and augment influencer channels

BEGIN;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS birth_date date;

ALTER TABLE advertiser_profiles
  RENAME COLUMN location TO address;

ALTER TABLE advertiser_profiles
  RENAME COLUMN category TO store_phone;

ALTER TABLE advertiser_profiles
  ALTER COLUMN store_phone TYPE text USING store_phone::text;

ALTER TABLE advertiser_profiles
  ADD COLUMN IF NOT EXISTS representative_name text;

UPDATE advertiser_profiles
  SET representative_name = COALESCE(representative_name, '');

ALTER TABLE advertiser_profiles
  ALTER COLUMN representative_name SET NOT NULL;

ALTER TABLE advertiser_profiles
  ALTER COLUMN store_phone SET NOT NULL;

ALTER TABLE influencer_channels
  ADD COLUMN IF NOT EXISTS follower_count integer;

UPDATE influencer_channels
  SET follower_count = COALESCE(follower_count, 0);

ALTER TABLE influencer_channels
  ALTER COLUMN follower_count SET NOT NULL;

COMMIT;
