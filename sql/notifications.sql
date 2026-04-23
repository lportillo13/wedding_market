create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in ('quote_answered', 'vendor_new_request', 'vendor_quote_accepted')),
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamp with time zone,
  deleted_at timestamp with time zone,
  email_status text not null default 'pending' check (email_status in ('pending', 'queued', 'sent', 'failed', 'skipped')),
  email_sent_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.notifications
  add column if not exists deleted_at timestamp with time zone;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('quote_answered', 'vendor_new_request', 'vendor_quote_accepted'));

grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.notifications to service_role;

create index if not exists notifications_recipient_created_idx
  on public.notifications using btree (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications using btree (recipient_id, read_at, created_at desc);

create index if not exists notifications_recipient_deleted_idx
  on public.notifications using btree (recipient_id, deleted_at, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_recipient_delete on public.notifications;
create policy notifications_recipient_delete
  on public.notifications
  for delete
  to authenticated
  using (recipient_id = auth.uid());

drop policy if exists notifications_recipient_insert on public.notifications;
create policy notifications_recipient_insert
  on public.notifications
  for insert
  to authenticated
  with check ((actor_id = auth.uid()) or (auth.role() = 'service_role'::text));

drop policy if exists notifications_recipient_select on public.notifications;
create policy notifications_recipient_select
  on public.notifications
  for select
  to authenticated
  using (recipient_id = auth.uid());

drop policy if exists notifications_recipient_update on public.notifications;
create policy notifications_recipient_update
  on public.notifications
  for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
