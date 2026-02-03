/*
  # Targeted RLS Fix (Skipping System Tables)
  
  This script explicitly enables Row Level Security (RLS) ONLY on the application tables.
  It creates a permissive policy "Enable all access for mock auth" to allow the app to work 
  with the simulated login flow.
*/

DO $$
DECLARE
    -- Explicit list of YOUR application tables
    -- This avoids touching spatial_ref_sys or other system tables
    target_tables text[] := ARRAY[
        'users',
        'beneficiary_profiles',
        'digital_health_cards',
        'reproductive_health_data',
        'health_logs',
        'daily_logs',
        'alerts',
        'asha_visits',
        'reminders',
        'content_topics',
        'schemes',
        'scheme_campaigns',
        'scheme_beneficiaries',
        'scheme_activity_logs',
        'aggregated_health_stats',
        'sync_queue'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY target_tables LOOP
        -- Check if table exists (to be safe)
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            
            -- 1. Enable RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            
            -- 2. Drop existing policy to avoid conflicts
            EXECUTE format('DROP POLICY IF EXISTS "Enable all access for mock auth" ON public.%I', t);
            
            -- 3. Create permissive policy
            EXECUTE format('CREATE POLICY "Enable all access for mock auth" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
            
            RAISE NOTICE 'Secured table: %', t;
        ELSE
            RAISE NOTICE 'Table not found (skipping): %', t;
        END IF;
    END LOOP;
END $$;
