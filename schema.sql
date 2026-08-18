-- Database schema for Civic Issue Reporter

-- 1. Create tables

-- profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'citizen' check (role in ('citizen','admin')),
  created_at timestamptz default now()
);

-- reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  category text not null check (category in ('road_damage','garbage','water_leakage','drainage','streetlight','other')),
  latitude double precision not null,
  longitude double precision not null,
  address text,
  image_url text,
  status text not null default 'pending' check (status in ('pending','in_progress','resolved','rejected')),
  rejection_reason text,
  resolved_image_url text,
  resolved_note text,
  upvote_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- report_votes (one per user per report)
create table if not exists public.report_votes (
  report_id uuid references public.reports(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (report_id, user_id)
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_votes enable row level security;

-- 3. RLS Policies

-- Profiles policies
create policy "Allow public read access to profiles" 
  on public.profiles for select 
  using (true);

create policy "Allow users to insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Allow users to update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Reports policies
create policy "Allow public read access to reports" 
  on public.reports for select 
  using (true);

create policy "Allow authenticated users to create reports" 
  on public.reports for insert 
  with check (auth.uid() = user_id);

create policy "Allow admins to update reports" 
  on public.reports for update 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Report Votes policies
create policy "Allow public read access to votes" 
  on public.report_votes for select 
  using (true);

create policy "Allow authenticated users to vote" 
  on public.report_votes for insert 
  with check (auth.uid() = user_id);

create policy "Allow authenticated users to remove their vote" 
  on public.report_votes for delete 
  using (auth.uid() = user_id);

-- 4. Automatically create profile on user signup (Trigger)
-- This function runs when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Citizen'),
    coalesce(new.raw_user_meta_data->>'role', 'citizen')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute on auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
