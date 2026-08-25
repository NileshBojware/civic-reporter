-- Database schema for SheherCare

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
drop policy if exists "Allow public read access to profiles" on public.profiles;
drop policy if exists "Allow users to insert their own profile" on public.profiles;
drop policy if exists "Allow users to update their own profile" on public.profiles;

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
drop policy if exists "Allow public read access to reports" on public.reports;
drop policy if exists "Allow authenticated users to create reports" on public.reports;
drop policy if exists "Allow admins to update reports" on public.reports;

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
drop policy if exists "Allow public read access to votes" on public.report_votes;
drop policy if exists "Allow authenticated users to vote" on public.report_votes;
drop policy if exists "Allow authenticated users to remove their vote" on public.report_votes;

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
declare
  default_role text := 'citizen';
begin
  -- Check if the email belongs to the predefined admin list
  -- TODO: Replace these placeholders with your actual admin emails in Supabase
  if new.email in ('shashiadmin@gmail.com', 'nileshadmin@gmail.com', 'aakleshadmin@gmail.com') then
    default_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Citizen'),
    default_role
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute on auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Instruction to upgrade existing users to admin in Supabase SQL editor:
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- FROM auth.users 
-- WHERE public.profiles.id = auth.users.id 
-- AND auth.users.email IN ('shashiadmin@gmail.com', 'nileshadmin@gmail.com', 'aakleshadmin@gmail.com');


-- 5. Storage Buckets and Policies Setup
-- Note: Run this in the Supabase SQL Editor to initialize storage buckets and policies

-- Create buckets if they do not exist
insert into storage.buckets (id, name, public)
values ('reports-evidence', 'reports-evidence', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('reports-resolutions', 'reports-resolutions', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist to prevent errors on re-run
drop policy if exists "Allow public read access to reports-evidence" on storage.objects;
drop policy if exists "Allow authenticated users to upload to reports-evidence" on storage.objects;
drop policy if exists "Allow public read access to reports-resolutions" on storage.objects;
drop policy if exists "Allow authenticated users to upload to reports-resolutions" on storage.objects;

-- Policies for 'reports-evidence'
create policy "Allow public read access to reports-evidence"
on storage.objects for select
using (bucket_id = 'reports-evidence');

create policy "Allow authenticated users to upload to reports-evidence"
on storage.objects for insert
to authenticated
with check (bucket_id = 'reports-evidence');

-- Policies for 'reports-resolutions'
create policy "Allow public read access to reports-resolutions"
on storage.objects for select
using (bucket_id = 'reports-resolutions');

create policy "Allow authenticated users to upload to reports-resolutions"
on storage.objects for insert
to authenticated
with check (bucket_id = 'reports-resolutions');


-- 6. Notifications System

-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean default false,
  type text not null check (type in ('status_change', 'new_report')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies for notifications
drop policy if exists "Allow users to read their own notifications" on public.notifications;
drop policy if exists "Allow users to update their own notifications" on public.notifications;

create policy "Allow users to read their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Allow users to update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Trigger for Admin notification when a new report is created
create or replace function public.handle_new_report_notification()
returns trigger as $$
declare
  admin_rec record;
begin
  for admin_rec in select id from public.profiles where role = 'admin' loop
    insert into public.notifications (user_id, report_id, title, message, type)
    values (
      admin_rec.id,
      new.id,
      'New Issue Reported',
      'A new issue has been reported: "' || new.title || '"',
      'new_report'
    );
  end loop;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_report_created on public.reports;
create trigger on_report_created
  after insert on public.reports
  for each row execute procedure public.handle_new_report_notification();

-- Trigger for Citizen notification when report status changes
create or replace function public.handle_status_change_notification()
returns trigger as $$
begin
  if (old.status is distinct from new.status) and new.user_id is not null then
    insert into public.notifications (user_id, report_id, title, message, type)
    values (
      new.user_id,
      new.id,
      'Issue Status Updated',
      'Your reported issue "' || new.title || '" status has been changed to ' || new.status || '.',
      'status_change'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_report_status_changed on public.reports;
create trigger on_report_status_changed
  after update on public.reports
  for each row execute procedure public.handle_status_change_notification();


