-- ==============================================================================
-- Supabase Security Migration: Perfect 0-Warning RLS Policy Setup
-- ==============================================================================

-- 1. Enable RLS on all 19 public schema tables
ALTER TABLE IF EXISTS public.deactivated_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_views ENABLE ROW LEVEL SECURITY;

-- 2. Drop previous legacy policies to replace with targeted role-restricted policies
DO $$
DECLARE
    tbl text;
    tables_list text[] := ARRAY[
        'users', 'audit_logs', 'contact_credits', 'contact_unlocks',
        'deactivated_properties', 'favorites', 'notifications', 'payments',
        'property_reports', 'property_verifications', 'property_views',
        'saved_searches', 'subscriptions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_list LOOP
        EXECUTE format('DROP POLICY IF EXISTS service_access_%I ON public.%I;', tbl, tbl);
    END LOOP;
END $$;

-- 3. Create SELECT-only policies for public data (Supabase Linter permits FOR SELECT USING (true))
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'allow_public_read_properties') THEN
        CREATE POLICY allow_public_read_properties ON public.properties FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'allow_public_read_locations') THEN
        CREATE POLICY allow_public_read_locations ON public.locations FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_images' AND policyname = 'allow_public_read_property_images') THEN
        CREATE POLICY allow_public_read_property_images ON public.property_images FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_amenities' AND policyname = 'allow_public_read_property_amenities') THEN
        CREATE POLICY allow_public_read_property_amenities ON public.property_amenities FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'allow_public_read_subscription_plans') THEN
        CREATE POLICY allow_public_read_subscription_plans ON public.subscription_plans FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'allow_public_read_agents') THEN
        CREATE POLICY allow_public_read_agents ON public.agents FOR SELECT USING (true);
    END IF;

    -- Service-role targeted policies for private backend tables (restricted to service_role)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'service_role_users') THEN
        CREATE POLICY service_role_users ON public.users TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'service_role_audit_logs') THEN
        CREATE POLICY service_role_audit_logs ON public.audit_logs TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_credits' AND policyname = 'service_role_contact_credits') THEN
        CREATE POLICY service_role_contact_credits ON public.contact_credits TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_unlocks' AND policyname = 'service_role_contact_unlocks') THEN
        CREATE POLICY service_role_contact_unlocks ON public.contact_unlocks TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deactivated_properties' AND policyname = 'service_role_deactivated_properties') THEN
        CREATE POLICY service_role_deactivated_properties ON public.deactivated_properties TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'favorites' AND policyname = 'service_role_favorites') THEN
        CREATE POLICY service_role_favorites ON public.favorites TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'service_role_notifications') THEN
        CREATE POLICY service_role_notifications ON public.notifications TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'service_role_payments') THEN
        CREATE POLICY service_role_payments ON public.payments TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_reports' AND policyname = 'service_role_property_reports') THEN
        CREATE POLICY service_role_property_reports ON public.property_reports TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_verifications' AND policyname = 'service_role_property_verifications') THEN
        CREATE POLICY service_role_property_verifications ON public.property_verifications TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_views' AND policyname = 'service_role_property_views') THEN
        CREATE POLICY service_role_property_views ON public.property_views TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'service_role_saved_searches') THEN
        CREATE POLICY service_role_saved_searches ON public.saved_searches TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'service_role_subscriptions') THEN
        CREATE POLICY service_role_subscriptions ON public.subscriptions TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
