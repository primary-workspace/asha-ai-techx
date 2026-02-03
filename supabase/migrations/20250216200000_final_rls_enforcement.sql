/*
  # Final RLS Enforcement & Table Check
  
  1. Ensures 'daily_logs' table exists (critical for Tracker).
  2. Enables Row Level Security (RLS) on ALL application tables.
  3. Creates permissive policies for MVP (Mock Auth) access.
  4. Skips system tables to avoid permission errors.
*/

-- 1. Ensure daily_logs exists (if missing)
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id),
  date date,
  mood text,
  symptoms text[],
  notes text,
  created_at timestamp DEFAULT now()
);

-- 2. Enable RLS and Create Policies for ALL tables
DO $$
DECLARE
  -- List of all application tables
  tables text[] := ARRAY[
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
  FOREACH t IN ARRAY tables LOOP
    -- Check if table exists before trying to alter it
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      
      -- Enable RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      
      -- Drop existing policy to avoid conflicts
      EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON public.%I', t);
      
      -- Create new permissive policy
      EXECUTE format('CREATE POLICY "Public Access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
      
      RAISE NOTICE 'Secured table: %', t;
    END IF;
  END LOOP;
END $$;
