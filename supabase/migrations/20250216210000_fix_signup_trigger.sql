-- ============================================================
-- FIX: Database Error Saving New User (Status 500)
-- ============================================================

-- 1. Drop any existing triggers that might be broken
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Create a robust function to handle new user creation
-- We use SECURITY DEFINER to ensure it has permission to write to public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, role)
  values (
    new.id,
    -- Handle missing metadata gracefully
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    -- Cast role safely, defaulting to beneficiary if missing/invalid
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'beneficiary')
  )
  on conflict (id) do nothing; -- Prevent errors if row exists
  return new;
end;
$$ language plpgsql security definer;

-- 3. Attach the trigger to auth.users
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 4. Ensure public.users is writable
grant insert, update, select on table public.users to service_role;
grant insert, update, select on table public.users to postgres;
grant insert, update, select on table public.users to anon;
grant insert, update, select on table public.users to authenticated;
