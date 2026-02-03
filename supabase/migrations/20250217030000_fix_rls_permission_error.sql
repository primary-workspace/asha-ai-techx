/*
  # Fix RLS Permission Error
  
  SUMMARY:
  - Explicitly targets application tables only.
  - Skips 'spatial_ref_sys' to avoid permission errors.
  - Enables RLS and sets public access policies for MVP.
*/

DO $$
DECLARE
    -- List of specific application tables to secure
    app_tables text[] := ARRAY[
        'users',
        'beneficiary_profiles',
        'health_logs',
        'daily_logs',
        'alerts',
        'schemes',
        'scheme_beneficiaries',
        'scheme_campaigns',
        'scheme_activity_logs',
        'reminders',
        'asha_visits',
        'digital_health_cards',
        'reproductive_health_data',
        'content_topics',
        'aggregated_health_stats',
        'sync_queue'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY app_tables
    LOOP
        -- Check if table exists before trying to alter it
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            
            -- 1. Enable Row Level Security
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            
            -- 2. Drop existing policies to avoid conflicts
            BEGIN
                EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON public.%I', t);
                EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON public.%I', t);
                EXECUTE format('DROP POLICY IF EXISTS "Enable insert access for all users" ON public.%I', t);
                EXECUTE format('DROP POLICY IF EXISTS "Enable update access for all users" ON public.%I', t);
                EXECUTE format('DROP POLICY IF EXISTS "Enable delete access for all users" ON public.%I', t);
            EXCEPTION WHEN OTHERS THEN
                NULL; -- Ignore errors if policy doesn't exist
            END;

            -- 3. Create a permissive policy for MVP (Mock Auth)
            -- This allows the app to function with the anon key
            EXECUTE format('CREATE POLICY "Public Access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
            
            RAISE NOTICE 'Secured table: %', t;
        END IF;
    END LOOP;
END $$;
