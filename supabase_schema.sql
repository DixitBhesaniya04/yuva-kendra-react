-- =========================================================
-- YUVA KENDRA WEEKLY REPORTING SYSTEM
-- SUPABASE DATABASE SETUP (PRODUCTION READY)
-- =========================================================

-- ===============================
-- EXTENSIONS
-- ===============================
create extension if not exists "uuid-ossp";

-- ===============================
-- CITIES TABLE
-- ===============================
create table if not exists public.cities (
  id uuid primary key default uuid_generate_v4(),
  city_name text not null,
  pin_code text not null,
  created_at timestamp with time zone default now()
);

-- ===============================
-- KENDRAS TABLE
-- ===============================
create table if not exists public.kendras (
  id uuid primary key default uuid_generate_v4(),
  kendra_name text not null,
  city_id uuid not null references public.cities(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- ===============================
-- PROFILES (USERS)
-- ===============================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text not null check (role in ('admin', 'member')),
  kendra_id uuid references public.kendras(id),
  created_at timestamp with time zone default now()
);

-- ===============================
-- WEEKLY REPORTS
-- ===============================
create table if not exists public.weekly_reports (
  id uuid primary key default uuid_generate_v4(),
  kendra_id uuid not null references public.kendras(id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,

  yuva_kendra_attendance integer not null default 0,
  bhavferni_attendance integer not null default 0,
  pravachan_attendance integer not null default 0,

  gender text not null
    check (gender in ('Male', 'Female')),

  description text,

  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default now(),

  constraint unique_kendra_week unique (kendra_id, week_start_date)
);

-- ===============================
-- AUTO PROFILE CREATION TRIGGER
-- ===============================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, kendra_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    nullif(new.raw_user_meta_data->>'kendra_id', '')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ===============================
-- ENABLE ROW LEVEL SECURITY
-- ===============================
alter table public.cities enable row level security;
alter table public.kendras enable row level security;
alter table public.profiles enable row level security;
alter table public.weekly_reports enable row level security;

-- ===============================
-- HELPER FUNCTIONS
-- ===============================
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable;

create or replace function user_kendra()
returns uuid as $$
  select kendra_id from public.profiles where id = auth.uid();
$$ language sql stable;

-- ===============================
-- RLS POLICIES
-- ===============================

-- ---- CITIES (ADMIN ONLY)
create policy "Admin manage cities"
on public.cities
for all
using (is_admin());

-- ---- KENDRAS (ADMIN ONLY)
create policy "Admin manage kendras"
on public.kendras
for all
using (is_admin());

-- ---- PROFILES
create policy "Admin read profiles"
on public.profiles
for select
using (is_admin());

create policy "User read own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Admin update profiles"
on public.profiles
for update
using (is_admin());

-- ---- WEEKLY REPORTS (READ)
create policy "Admin read all reports"
on public.weekly_reports
for select
using (is_admin());

create policy "Member read own kendra reports"
on public.weekly_reports
for select
using (kendra_id = user_kendra());

-- ---- WEEKLY REPORTS (INSERT)
create policy "Member insert own kendra report"
on public.weekly_reports
for insert
with check (kendra_id = user_kendra());

-- ---- WEEKLY REPORTS (UPDATE)
create policy "Admin update reports"
on public.weekly_reports
for update
using (is_admin());

create policy "Member update own kendra report"
on public.weekly_reports
for update
using (kendra_id = user_kendra());

-- ---- WEEKLY REPORTS (DELETE)
create policy "Admin delete reports"
on public.weekly_reports
for delete
using (is_admin());

-- ===============================
-- INDEXES FOR PERFORMANCE
-- ===============================
create index if not exists idx_kendras_city on public.kendras(city_id);
create index if not exists idx_profiles_kendra on public.profiles(kendra_id);
create index if not exists idx_reports_kendra on public.weekly_reports(kendra_id);
create index if not exists idx_reports_week on public.weekly_reports(week_start_date);

-- ===============================
-- END OF FILE
-- ===============================
