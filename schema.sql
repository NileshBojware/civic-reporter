-- Database schema for SheherCare with Department Hierarchy & Admins

-- 1. Create tables

-- profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'citizen' check (role in ('citizen','admin')),
  department text, -- 'pwd', 'electrical', 'health', 'water', 'sewerage', 'solidwaste', 'gardens', 'townplanning', 'traffic', 'grievance'
  created_at timestamptz default now()
);

-- Migration if profiles table already existed without department column:
alter table public.profiles add column if not exists department text;

-- reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  category text not null check (category in (
    'roads_transport', 'water_supply', 'drainage_sewerage', 'waste_management',
    'street_lighting', 'sanitation_health', 'parks_spaces', 'traffic_parking',
    'electricity_utilities', 'encroachment_construction', 'public_infrastructure', 'other_civic',
    'road_damage', 'garbage', 'water_leakage', 'drainage', 'streetlight', 'other'
  )),
  latitude double precision not null,
  longitude double precision not null,
  address text,
  image_url text,
  status text not null default 'pending' check (status in ('pending','verified','in_progress','resolved','rejected')),
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
-- This function assigns admin role & specific department to department admin emails
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role text := 'citizen';
  dept_id text := null;
  default_name text := coalesce(new.raw_user_meta_data->>'full_name', 'New Citizen');
  user_email text := lower(coalesce(new.email, ''));
begin
  -- Department Admin Email mappings
  if user_email = 'admin.pwd@shehercare.in' then
    default_role := 'admin';
    dept_id := 'pwd';
    default_name := 'Public Works / Engineering Admin';
  elsif user_email = 'admin.electrical@shehercare.in' then
    default_role := 'admin';
    dept_id := 'electrical';
    default_name := 'Electrical Department Admin';
  elsif user_email = 'admin.health@shehercare.in' then
    default_role := 'admin';
    dept_id := 'health';
    default_name := 'Public Health Department Admin';
  elsif user_email = 'admin.water@shehercare.in' then
    default_role := 'admin';
    dept_id := 'water';
    default_name := 'Water Supply Department Admin';
  elsif user_email = 'admin.sewerage@shehercare.in' then
    default_role := 'admin';
    dept_id := 'sewerage';
    default_name := 'Sewerage & Drainage Department Admin';
  elsif user_email = 'admin.solidwaste@shehercare.in' then
    default_role := 'admin';
    dept_id := 'solidwaste';
    default_name := 'Solid Waste Management Department Admin';
  elsif user_email = 'admin.gardens@shehercare.in' then
    default_role := 'admin';
    dept_id := 'gardens';
    default_name := 'Garden & Parks Department Admin';
  elsif user_email = 'admin.townplanning@shehercare.in' then
    default_role := 'admin';
    dept_id := 'townplanning';
    default_name := 'Town Planning / Encroachment Admin';
  elsif user_email = 'admin.traffic@shehercare.in' then
    default_role := 'admin';
    dept_id := 'traffic';
    default_name := 'Traffic Department Admin';
  elsif user_email = 'admin.grievance@shehercare.in' then
    default_role := 'admin';
    dept_id := 'grievance';
    default_name := 'General Administration / Grievance Cell Admin';
  elsif user_email in ('shashiadmin@gmail.com', 'nileshadmin@gmail.com', 'aakleshadmin@gmail.com') then
    default_role := 'admin';
    dept_id := 'pwd';
  end if;

  -- Allow user_metadata to override if specified
  if new.raw_user_meta_data->>'department' is not null then
    dept_id := new.raw_user_meta_data->>'department';
  end if;
  if new.raw_user_meta_data->>'role' = 'admin' then
    default_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, role, department)
  values (
    new.id,
    default_name,
    default_role,
    dept_id
  )
  on conflict (id) do update
  set 
    full_name = excluded.full_name,
    role = excluded.role,
    department = excluded.department;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


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

-- Trigger for Department Admin notification when a new report is created
create or replace function public.handle_new_report_notification()
returns trigger as $$
declare
  target_dept text := 'grievance';
  dept_short text := 'General';
  admin_rec record;
begin
  -- Resolve department from category
  if new.category in ('roads_transport', 'public_infrastructure', 'road_damage') then
    target_dept := 'pwd';
    dept_short := 'PWD';
  elsif new.category in ('street_lighting', 'electricity_utilities', 'streetlight') then
    target_dept := 'electrical';
    dept_short := 'Electrical';
  elsif new.category in ('sanitation_health') then
    target_dept := 'health';
    dept_short := 'Health';
  elsif new.category in ('water_supply', 'water_leakage') then
    target_dept := 'water';
    dept_short := 'Water';
  elsif new.category in ('drainage_sewerage', 'drainage') then
    target_dept := 'sewerage';
    dept_short := 'Sewerage';
  elsif new.category in ('waste_management', 'garbage') then
    target_dept := 'solidwaste';
    dept_short := 'Waste';
  elsif new.category in ('parks_spaces') then
    target_dept := 'gardens';
    dept_short := 'Gardens';
  elsif new.category in ('encroachment_construction') then
    target_dept := 'townplanning';
    dept_short := 'Planning';
  elsif new.category in ('traffic_parking') then
    target_dept := 'traffic';
    dept_short := 'Traffic';
  else
    target_dept := 'grievance';
    dept_short := 'Grievance';
  end if;

  -- Insert notification for the matching department admin and grievance cell admin
  for admin_rec in 
    select id from public.profiles 
    where role = 'admin' and (department = target_dept or department = 'grievance')
  loop
    insert into public.notifications (user_id, report_id, title, message, type)
    values (
      admin_rec.id,
      new.id,
      '[' || dept_short || '] New Issue Reported',
      'A new issue in your jurisdiction has been reported: "' || new.title || '"',
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


-- 7. Comments System

create table if not exists public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz default now()
);

alter table public.report_comments enable row level security;

drop policy if exists "Allow public read access to comments" on public.report_comments;
drop policy if exists "Allow authenticated users to post comments" on public.report_comments;
drop policy if exists "Allow users to delete their own comments" on public.report_comments;

create policy "Allow public read access to comments"
  on public.report_comments for select
  using (true);

create policy "Allow authenticated users to post comments"
  on public.report_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Allow users to delete their own comments"
  on public.report_comments for delete
  using (auth.uid() = user_id);

-- 8. Web Push Subscriptions

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Allow users to manage their own push subscriptions" on public.push_subscriptions;
drop policy if exists "Allow service role to read push subscriptions" on public.push_subscriptions;

create policy "Allow users to manage their own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Allow service role to read push subscriptions"
  on public.push_subscriptions for select
  to service_role
  using (true);

drop policy if exists "Allow service role to insert notifications" on public.notifications;
create policy "Allow service role to insert notifications"
  on public.notifications for insert
  to service_role
  with check (true);

-- Realtime subscription publication
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.push_subscriptions;
