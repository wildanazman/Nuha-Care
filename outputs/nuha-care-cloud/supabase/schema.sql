create extension if not exists "pgcrypto";

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  relationship text,
  created_at timestamptz default now()
);

create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text,
  weight_kg numeric not null,
  notes text,
  created_by_member_id uuid,
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists meal_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  meal_type text not null,
  time_served text,
  food_details text,
  additional_food text,
  food_amount_served text,
  drink_details text,
  drink_amount_served text,
  before_photo_url text,
  before_notes text,
  time_finished text,
  food_amount_eaten text,
  drink_amount_finished text,
  after_photo_url text,
  feeding_method text,
  issues text[],
  after_notes text,
  created_by_member_id uuid,
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists medicine_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text,
  medicine_name text not null,
  dosage text,
  status text not null,
  notes text,
  created_by_member_id uuid,
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bowel_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  status text not null,
  type text,
  notes text,
  created_by_member_id uuid,
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists period_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  end_date date,
  flow text,
  symptoms text[],
  notes text,
  created_by_member_id uuid,
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  time text,
  location text,
  reason text,
  questions text,
  after_notes text,
  created_by_member_id uuid,
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table meal_logs add column if not exists additional_food text;

alter table family_members enable row level security;
alter table weight_logs enable row level security;
alter table meal_logs enable row level security;
alter table medicine_logs enable row level security;
alter table bowel_logs enable row level security;
alter table period_logs enable row level security;
alter table appointments enable row level security;

drop policy if exists "family members public family app access" on family_members;
drop policy if exists "weight logs public family app access" on weight_logs;
drop policy if exists "meal logs public family app access" on meal_logs;
drop policy if exists "medicine logs public family app access" on medicine_logs;
drop policy if exists "bowel logs public family app access" on bowel_logs;
drop policy if exists "period logs public family app access" on period_logs;
drop policy if exists "appointments public family app access" on appointments;

create policy "family members public family app access" on family_members for all using (true) with check (true);
create policy "weight logs public family app access" on weight_logs for all using (true) with check (true);
create policy "meal logs public family app access" on meal_logs for all using (true) with check (true);
create policy "medicine logs public family app access" on medicine_logs for all using (true) with check (true);
create policy "bowel logs public family app access" on bowel_logs for all using (true) with check (true);
create policy "period logs public family app access" on period_logs for all using (true) with check (true);
create policy "appointments public family app access" on appointments for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "meal photos readable" on storage.objects;
drop policy if exists "meal photos uploadable" on storage.objects;
drop policy if exists "meal photos updateable" on storage.objects;
drop policy if exists "meal photos deleteable" on storage.objects;

create policy "meal photos readable" on storage.objects
for select using (bucket_id = 'meal-photos');

create policy "meal photos uploadable" on storage.objects
for insert with check (bucket_id = 'meal-photos');

create policy "meal photos updateable" on storage.objects
for update using (bucket_id = 'meal-photos') with check (bucket_id = 'meal-photos');

create policy "meal photos deleteable" on storage.objects
for delete using (bucket_id = 'meal-photos');
