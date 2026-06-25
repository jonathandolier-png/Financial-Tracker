-- Country Days Tracker — Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

create table if not exists country_visits (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'default',
  country_code text not null,   -- ISO 3166-1 alpha-2 e.g. "GB", "AE"
  country_name text not null,
  date date not null,           -- the calendar date the user was in this country
  financial_year int not null,  -- e.g. 2025 = April 2025 – March 2026
  created_at timestamptz default now(),
  unique (user_id, country_code, date)
);

create table if not exists country_limits (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'default',
  country_code text not null,
  day_limit int not null,
  alert_days_before int not null default 10,
  created_at timestamptz default now(),
  unique (user_id, country_code)
);

-- Allow public read/write (since this is a personal single-user app with no auth)
alter table country_visits enable row level security;
alter table country_limits enable row level security;

create policy "Allow all for default user" on country_visits
  for all using (true) with check (true);

create policy "Allow all for default user" on country_limits
  for all using (true) with check (true);
