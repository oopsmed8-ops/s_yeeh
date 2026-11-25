-- Sidahmed-auto: schema additions for inventory details and customer reviews
-- Run in Supabase SQL Editor after the initial five-table schema.

alter table public.cars
  add column if not exists category text not null default 'premium',
  add column if not exists body_type text,
  add column if not exists color text,
  add column if not exists horsepower integer check (horsepower is null or horsepower >= 0);

-- Reviews are submitted by visitors and published only after admin approval.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 80),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 12 and 1200),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists reviews_approved_created_idx
  on public.reviews(approved, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "reviews_public_read" on public.reviews;
drop policy if exists "reviews_public_insert" on public.reviews;
drop policy if exists "reviews_admin_manage" on public.reviews;

create policy "reviews_public_read"
on public.reviews for select
to anon, authenticated
using (approved = true or public.is_admin());

create policy "reviews_public_insert"
on public.reviews for insert
to anon, authenticated
with check (
  approved = false
  and char_length(display_name) between 2 and 80
  and rating between 1 and 5
  and char_length(comment) between 12 and 1200
);

create policy "reviews_admin_manage"
on public.reviews for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert on public.reviews to anon, authenticated;
grant update, delete on public.reviews to authenticated;

-- Keep the current administrator profile complete.
update public.profiles
set full_name = 'Direzione Sidahmed-auto'
where role = 'admin' and (full_name is null or btrim(full_name) = '');

-- Ensure new inventory fields can be read/managed under the existing cars RLS policies.
grant select on public.cars to anon, authenticated;
grant insert, update, delete on public.cars to authenticated;
grant select, insert, update, delete on public.car_images to authenticated;


-- Sidahmed-auto live catalogue: public visitors can only read published cars and their images.
alter table public.car_images
  add column if not exists sort_order integer not null default 0;

alter table public.cars enable row level security;
alter table public.car_images enable row level security;

drop policy if exists "cars_public_read_published" on public.cars;
create policy "cars_public_read_published"
on public.cars for select
to anon, authenticated
using (status = 'published' or public.is_admin());

drop policy if exists "car_images_public_read_published" on public.car_images;
create policy "car_images_public_read_published"
on public.car_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.cars c
    where c.id = car_images.car_id
      and (c.status = 'published' or public.is_admin())
  )
);

grant select on public.cars, public.car_images to anon, authenticated;
grant insert, update, delete on public.cars, public.car_images to authenticated;
