-- Ensure daily_logs table exists and has correct schema
create table if not exists daily_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  mood text,
  symptoms jsonb default '[]'::jsonb,
  notes text,
  flow text,
  created_at timestamp default now()
);

-- Add unique constraint to prevent duplicate logs for same day
do $$ 
begin
  if not exists (select 1 from pg_constraint where conname = 'daily_logs_user_id_date_key') then
    alter table daily_logs add constraint daily_logs_user_id_date_key unique (user_id, date);
  end if;
end $$;

-- Enable RLS
alter table daily_logs enable row level security;

-- Policies (Public for MVP/Mock Auth)
drop policy if exists "Enable read access for all users" on daily_logs;
drop policy if exists "Enable insert access for all users" on daily_logs;
drop policy if exists "Enable update access for all users" on daily_logs;

create policy "Enable read access for all users" on daily_logs for select using (true);
create policy "Enable insert access for all users" on daily_logs for insert with check (true);
create policy "Enable update access for all users" on daily_logs for update using (true);
