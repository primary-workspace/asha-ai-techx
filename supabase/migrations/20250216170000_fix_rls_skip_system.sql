/*
  # Fix RLS Permissions and Ensure Daily Logs
  
  1. Creates 'daily_logs' table if missing (required by frontend).
  2. Enables RLS only on application-specific tables (skipping PostGIS system tables).
  3. Re-applies open policies for the Mock Auth flow.
*/

-- 1. Ensure daily_logs table exists (Frontend dependency)
create table if not exists public.daily_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  date date not null,
  mood text,
  symptoms jsonb,
  notes text,
  created_at timestamp default now()
);

-- 2. Enable RLS explicitly on Application Tables ONLY
-- We do this one by one to avoid touching 'spatial_ref_sys'
alter table public.users enable row level security;
alter table public.beneficiary_profiles enable row level security;
alter table public.digital_health_cards enable row level security;
alter table public.reproductive_health_data enable row level security;
alter table public.health_logs enable row level security;
alter table public.daily_logs enable row level security;
alter table public.alerts enable row level security;
alter table public.asha_visits enable row level security;
alter table public.reminders enable row level security;
alter table public.content_topics enable row level security;
alter table public.schemes enable row level security;
alter table public.scheme_campaigns enable row level security;
alter table public.scheme_beneficiaries enable row level security;
alter table public.scheme_activity_logs enable row level security;
alter table public.aggregated_health_stats enable row level security;
alter table public.sync_queue enable row level security;

-- 3. Create Open Policies (Drop existing first to avoid conflicts)
do $$ 
declare
  t text;
  tables text[] := array[
    'users', 'beneficiary_profiles', 'digital_health_cards', 
    'reproductive_health_data', 'health_logs', 'daily_logs', 'alerts', 
    'asha_visits', 'reminders', 'content_topics', 'schemes', 
    'scheme_campaigns', 'scheme_beneficiaries', 'scheme_activity_logs', 
    'aggregated_health_stats', 'sync_queue'
  ];
begin
  foreach t in array tables loop
    -- Drop existing policies if any
    execute format('drop policy if exists "Enable read access for all users" on public.%I', t);
    execute format('drop policy if exists "Enable insert access for all users" on public.%I', t);
    execute format('drop policy if exists "Enable update access for all users" on public.%I', t);
    execute format('drop policy if exists "Enable delete access for all users" on public.%I', t);
    
    -- Create permissive policies for Mock Auth flow
    execute format('create policy "Enable read access for all users" on public.%I for select using (true)', t);
    execute format('create policy "Enable insert access for all users" on public.%I for insert with check (true)', t);
    execute format('create policy "Enable update access for all users" on public.%I for update using (true)', t);
    execute format('create policy "Enable delete access for all users" on public.%I for delete using (true)', t);
  end loop;
end $$;
