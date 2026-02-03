-- =================================================================
-- FIX: RESET POLICIES FOR CHILDREN TABLE
-- Description: Drops all potential existing policies and re-creates them
-- to avoid "policy already exists" errors.
-- =================================================================

-- 1. Drop ALL existing policies for the children table
drop policy if exists "Enable read access for all users" on public.children;
drop policy if exists "Enable insert access for all users" on public.children;
drop policy if exists "Enable update access for all users" on public.children;
drop policy if exists "Enable all access for all users" on public.children;

-- 2. Ensure RLS is enabled
alter table public.children enable row level security;

-- 3. Re-create policies freshly

-- Allow Reading
create policy "Enable read access for all users"
on public.children for select
using (true);

-- Allow Inserting
create policy "Enable insert access for all users"
on public.children for insert
with check (true);

-- Allow Updating (Crucial for Vaccination Tracker)
create policy "Enable update access for all users"
on public.children for update
using (true);
