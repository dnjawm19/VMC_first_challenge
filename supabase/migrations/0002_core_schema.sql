-- 0002_core_schema.sql
-- Core schema for campaign matching platform

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_method_enum') THEN
        CREATE TYPE auth_method_enum AS ENUM ('email', 'external');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('advertiser', 'influencer');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_enum') THEN
        CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_status_enum') THEN
        CREATE TYPE channel_status_enum AS ENUM ('pending', 'verified', 'failed');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status_enum') THEN
        CREATE TYPE campaign_status_enum AS ENUM ('recruiting', 'closed', 'selected');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status_enum') THEN
        CREATE TYPE application_status_enum AS ENUM ('applied', 'selected', 'rejected');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id),
    full_name text NOT NULL,
    phone text NOT NULL,
    role user_role_enum NOT NULL,
    auth_method auth_method_enum NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_terms_acceptances (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    terms_code text NOT NULL,
    version text NOT NULL,
    accepted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS influencer_profiles (
    user_id uuid PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    birth_date date NOT NULL,
    age_policy_status verification_status_enum NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS influencer_channels (
    id bigserial PRIMARY KEY,
    influencer_user_id uuid NOT NULL REFERENCES influencer_profiles(user_id) ON DELETE CASCADE,
    channel_type text NOT NULL CHECK (channel_type IN ('naver', 'youtube', 'instagram', 'threads')),
    channel_name text NOT NULL,
    channel_url text NOT NULL,
    status channel_status_enum NOT NULL DEFAULT 'pending',
    last_checked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS advertiser_profiles (
    user_id uuid PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    company_name text NOT NULL,
    location text NOT NULL,
    category text NOT NULL,
    business_registration_number text NOT NULL UNIQUE,
    verification_status verification_status_enum NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_user_id uuid NOT NULL REFERENCES advertiser_profiles(user_id) ON DELETE CASCADE,
    title text NOT NULL,
    recruitment_start_at date NOT NULL,
    recruitment_end_at date NOT NULL,
    capacity integer NOT NULL CHECK (capacity > 0),
    benefits text NOT NULL,
    mission text NOT NULL,
    store_info text NOT NULL,
    status campaign_status_enum NOT NULL DEFAULT 'recruiting',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (recruitment_end_at >= recruitment_start_at)
);

CREATE TABLE IF NOT EXISTS campaign_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_user_id uuid NOT NULL REFERENCES influencer_profiles(user_id) ON DELETE CASCADE,
    motivation text NOT NULL,
    visit_plan_date date NOT NULL,
    status application_status_enum NOT NULL DEFAULT 'applied',
    submitted_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, influencer_user_id)
);

CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_user_profiles') THEN
        CREATE TRIGGER set_timestamp_user_profiles
        BEFORE UPDATE ON user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.set_timestamp();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_influencer_profiles') THEN
        CREATE TRIGGER set_timestamp_influencer_profiles
        BEFORE UPDATE ON influencer_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.set_timestamp();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_influencer_channels') THEN
        CREATE TRIGGER set_timestamp_influencer_channels
        BEFORE UPDATE ON influencer_channels
        FOR EACH ROW
        EXECUTE FUNCTION public.set_timestamp();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_advertiser_profiles') THEN
        CREATE TRIGGER set_timestamp_advertiser_profiles
        BEFORE UPDATE ON advertiser_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.set_timestamp();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_campaigns') THEN
        CREATE TRIGGER set_timestamp_campaigns
        BEFORE UPDATE ON campaigns
        FOR EACH ROW
        EXECUTE FUNCTION public.set_timestamp();
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_campaign_applications') THEN
        CREATE TRIGGER set_timestamp_campaign_applications
        BEFORE UPDATE ON campaign_applications
        FOR EACH ROW
        EXECUTE FUNCTION public.set_timestamp();
    END IF;
END
$$;

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_terms_acceptances DISABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE advertiser_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications DISABLE ROW LEVEL SECURITY;

COMMIT;
