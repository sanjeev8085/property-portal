-- ==============================================================================
-- Supabase Security Migration: Enable Row Level Security (RLS) on all Public Tables
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

-- 2. Create default SELECT policies for public read tables
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
END $$;
