-- ====================================================================
-- Excel Insight: Subscribed Emails & Premium Whitelist Migration
-- ====================================================================

-- 1. Create table for approved / subscribed emails
CREATE TABLE IF NOT EXISTS public.subscribed_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'Pro',
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'expired'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for subscribed_emails
ALTER TABLE public.subscribed_emails ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check if their own email exists
CREATE POLICY "Users can check their own subscription status"
    ON public.subscribed_emails FOR SELECT
    TO authenticated
    USING (lower(email) = lower(auth.jwt()->>'email'));

-- Allow service_role full access
CREATE POLICY "Service role full access to subscribed_emails"
    ON public.subscribed_emails FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Enhance public.profiles table with subscription status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'Free';

-- Update existing profiles email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Trigger to sync subscribed_emails change to profiles
CREATE OR REPLACE FUNCTION public.sync_subscription_to_profile()
RETURNS trigger AS $$
BEGIN
    UPDATE public.profiles
    SET is_subscribed = (NEW.status = 'active'),
        subscription_plan = NEW.plan,
        updated_at = now()
    WHERE lower(email) = lower(NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_subscribed_email_changed ON public.subscribed_emails;
CREATE TRIGGER on_subscribed_email_changed
    AFTER INSERT OR UPDATE ON public.subscribed_emails
    FOR EACH ROW EXECUTE FUNCTION public.sync_subscription_to_profile();

-- 4. Update handle_new_user to check subscribed_emails upon registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_is_subscribed BOOLEAN := false;
    v_plan TEXT := 'Free';
BEGIN
    -- Check if new user's email exists in subscribed_emails
    SELECT (status = 'active'), plan INTO v_is_subscribed, v_plan
    FROM public.subscribed_emails
    WHERE lower(email) = lower(new.email)
    LIMIT 1;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        is_subscribed,
        subscription_plan
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            split_part(new.email, '@', 1)
        ),
        COALESCE(
            new.raw_user_meta_data->>'avatar_url',
            new.raw_user_meta_data->>'picture',
            new.raw_user_meta_data->>'avatar'
        ),
        COALESCE(v_is_subscribed, false),
        COALESCE(v_plan, 'Free')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        is_subscribed = CASE 
            WHEN v_is_subscribed = true THEN true 
            ELSE public.profiles.is_subscribed 
        END,
        subscription_plan = CASE 
            WHEN v_is_subscribed = true THEN v_plan 
            ELSE public.profiles.subscription_plan 
        END,
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Insert existing admin / developer email so current active account remains valid
INSERT INTO public.subscribed_emails (email, plan, status, notes)
VALUES 
    ('rezalihsanumubarok@gmail.com', 'Enterprise', 'active', 'Admin Developer')
ON CONFLICT (email) DO UPDATE SET 
    status = 'active',
    plan = 'Enterprise';

-- Update existing profile for rezalihsanumubarok@gmail.com
UPDATE public.profiles
SET is_subscribed = true,
    subscription_plan = 'Enterprise'
WHERE lower(email) = 'rezalihsanumubarok@gmail.com';
