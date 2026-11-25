-- Sidahmed-auto: Richieste (inquiries) — colonne e policy per la gestione completa dalla dashboard.
-- Eseguire in Supabase → SQL Editor. Sicuro da rieseguire.
alter table public.inquiries
  add column if not exists phone text,
  add column if not exists status text not null default 'new';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'inquiries_status_check') then
    alter table public.inquiries add constraint inquiries_status_check check (status in ('new','contacted','closed'));
  end if;
end $$;

alter table public.inquiries enable row level security;
drop policy if exists "inquiries_public_insert" on public.inquiries;
drop policy if exists "inquiries_admin_manage" on public.inquiries;

-- I visitatori possono solo INVIARE una richiesta (mai leggerle).
create policy "inquiries_public_insert" on public.inquiries for insert to anon, authenticated
  with check (char_length(customer_name) between 2 and 100 and char_length(message) between 8 and 2000);
-- L'amministratore legge, aggiorna e elimina.
create policy "inquiries_admin_manage" on public.inquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant insert on public.inquiries to anon, authenticated;
grant select, update, delete on public.inquiries to authenticated;
