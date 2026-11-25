-- =====================================================================
-- Sidahmed-auto — Hardening & collegamento richieste ⇄ vetture
-- Supabase → SQL Editor → incolla ed esegui. Sicuro da rieseguire.
-- Sostituisce database-inbox.sql (che puoi non eseguire).
-- =====================================================================

-- 1) Funzione admin sicura (SECURITY DEFINER + search_path fisso)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 2) Richieste: colonne, collegamento alla vettura, vincoli
alter table public.inquiries
  add column if not exists phone  text,
  add column if not exists status text not null default 'new',
  add column if not exists car_id uuid references public.cars(id) on delete set null;
create index if not exists inquiries_car_id_idx on public.inquiries(car_id);
create index if not exists inquiries_created_idx on public.inquiries(created_at desc);

do $$ begin
  if not exists (select 1 from pg_constraint where conname='inquiries_status_check') then
    alter table public.inquiries add constraint inquiries_status_check check (status in ('new','contacted','closed'));
  end if;
end $$;

-- 3) Anti-spam lato server: max 5 richieste/ora per email o telefono; max 20 recensioni in attesa/ora
create or replace function public.throttle_inquiries() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.inquiries
      where created_at > now() - interval '1 hour'
        and (lower(email) = lower(new.email) or (new.phone is not null and phone = new.phone))) >= 5 then
    raise exception 'too_many_requests' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists trg_throttle_inquiries on public.inquiries;
create trigger trg_throttle_inquiries before insert on public.inquiries for each row execute function public.throttle_inquiries();

create or replace function public.throttle_reviews() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reviews where created_at > now() - interval '1 hour' and approved = false) >= 20 then
    raise exception 'too_many_requests' using errcode = 'P0001';
  end if;
  new.approved := false;               -- un visitatore non può mai auto-approvarsi
  return new;
end $$;
drop trigger if exists trg_throttle_reviews on public.reviews;
create trigger trg_throttle_reviews before insert on public.reviews for each row execute function public.throttle_reviews();

-- 4) RLS: inquiries
alter table public.inquiries enable row level security;
drop policy if exists "inquiries_public_insert" on public.inquiries;
drop policy if exists "inquiries_admin_manage"  on public.inquiries;
create policy "inquiries_public_insert" on public.inquiries for insert to anon, authenticated
  with check (char_length(customer_name) between 2 and 100 and char_length(message) between 8 and 3000 and char_length(email) <= 160);
create policy "inquiries_admin_manage" on public.inquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.inquiries from anon;
grant insert on public.inquiries to anon, authenticated;
grant select, update, delete on public.inquiries to authenticated;

-- 5) RLS: reviews (i visitatori inseriscono; vedono solo le approvate)
alter table public.reviews enable row level security;
drop policy if exists "reviews_public_insert"  on public.reviews;
drop policy if exists "reviews_public_read"    on public.reviews;
drop policy if exists "reviews_admin_manage"   on public.reviews;
create policy "reviews_public_insert" on public.reviews for insert to anon, authenticated
  with check (rating between 1 and 5 and char_length(comment) between 12 and 1200 and char_length(display_name) between 2 and 80);
create policy "reviews_public_read" on public.reviews for select to anon, authenticated using (approved = true or public.is_admin());
create policy "reviews_admin_manage" on public.reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.reviews from anon;
grant select, insert on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;

-- 6) RLS: profiles — ognuno legge solo il proprio; nessuno può auto-promuoversi admin
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
revoke all on public.profiles from anon;

-- 7) RLS: cars / car_images — pubblico vede solo le pubblicate, admin gestisce tutto
alter table public.cars enable row level security;
alter table public.car_images enable row level security;
drop policy if exists "cars_public_read"   on public.cars;
drop policy if exists "cars_admin_manage"  on public.cars;
drop policy if exists "car_images_public_read"  on public.car_images;
drop policy if exists "car_images_admin_manage" on public.car_images;
create policy "cars_public_read" on public.cars for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "cars_admin_manage" on public.cars for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "car_images_public_read" on public.car_images for select to anon, authenticated
  using (exists (select 1 from public.cars c where c.id = car_id and (c.status = 'published' or public.is_admin())));
create policy "car_images_admin_manage" on public.car_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke insert, update, delete on public.cars, public.car_images from anon;
