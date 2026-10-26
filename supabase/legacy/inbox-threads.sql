alter table public.rfq_invites
  add column if not exists id uuid default gen_random_uuid();

update public.rfq_invites
set id = gen_random_uuid()
where id is null;

alter table public.rfq_invites
  alter column id set not null;

create unique index if not exists rfq_invites_id_idx
  on public.rfq_invites using btree (id);

alter table public.rfq_invites
  add column if not exists viewed_at timestamp with time zone;

alter table public.rfq_invites
  add column if not exists last_activity_at timestamp with time zone default now();

alter table public.rfq_invites
  add column if not exists client_last_read_at timestamp with time zone;

alter table public.rfq_invites
  add column if not exists vendor_last_read_at timestamp with time zone;

alter table public.rfq_invites
  add column if not exists closed_at timestamp with time zone;

alter table public.rfq_invites
  add column if not exists closed_reason text;

update public.rfq_invites
set last_activity_at = coalesce(updated_at, created_at, now())
where last_activity_at is null;

create index if not exists rfq_invites_vendor_last_activity_idx
  on public.rfq_invites using btree (vendor_id, last_activity_at desc);

create index if not exists rfq_invites_rfq_last_activity_idx
  on public.rfq_invites using btree (rfq_id, last_activity_at desc);

create or replace function public.touch_rfq_invite_activity_from_quote()
returns trigger
language plpgsql
as $$
begin
  update public.rfq_invites
  set last_activity_at = coalesce(new.created_at, now())
  where rfq_id = new.rfq_id
    and vendor_id = new.vendor_id;

  return new;
end;
$$;

drop trigger if exists quotes_touch_rfq_invite_activity on public.quotes;
create trigger quotes_touch_rfq_invite_activity
after insert on public.quotes
for each row execute function public.touch_rfq_invite_activity_from_quote();

create or replace function public.touch_rfq_invite_activity_from_message()
returns trigger
language plpgsql
as $$
declare
  target_rfq_id uuid;
  target_vendor_id uuid;
begin
  select q.rfq_id, q.vendor_id
    into target_rfq_id, target_vendor_id
  from public.quotes q
  where q.id = new.quote_id;

  if target_rfq_id is not null and target_vendor_id is not null then
    update public.rfq_invites
    set last_activity_at = coalesce(new.created_at, now())
    where rfq_id = target_rfq_id
      and vendor_id = target_vendor_id;
  end if;

  return new;
end;
$$;

drop trigger if exists quote_messages_touch_rfq_invite_activity on public.quote_messages;
create trigger quote_messages_touch_rfq_invite_activity
after insert on public.quote_messages
for each row execute function public.touch_rfq_invite_activity_from_message();
