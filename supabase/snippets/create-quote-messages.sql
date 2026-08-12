create table if not exists public.quote_messages (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('client', 'vendor')),
  body text not null check (length(trim(body)) > 0),
  created_at timestamp with time zone not null default now()
);

create index if not exists quote_messages_quote_id_created_at_idx
  on public.quote_messages (quote_id, created_at);

alter table public.quote_messages enable row level security;

grant select, insert on table public.quote_messages to authenticated;
grant select, insert, update, delete on table public.quote_messages to service_role;

drop policy if exists quote_messages_client_select on public.quote_messages;
create policy quote_messages_client_select on public.quote_messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.quotes q
      join public.rfqs r on r.id = q.rfq_id
      where q.id = quote_messages.quote_id
        and r.owner_id = auth.uid()
    )
  );

drop policy if exists quote_messages_vendor_select on public.quote_messages;
create policy quote_messages_vendor_select on public.quote_messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.quotes q
      join public.vendors v on v.id = q.vendor_id
      where q.id = quote_messages.quote_id
        and v.owner_id = auth.uid()
    )
  );

drop policy if exists quote_messages_client_insert on public.quote_messages;
create policy quote_messages_client_insert on public.quote_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and sender_role = 'client'
    and exists (
      select 1
      from public.quotes q
      join public.rfqs r on r.id = q.rfq_id
      where q.id = quote_messages.quote_id
        and r.owner_id = auth.uid()
    )
  );

drop policy if exists quote_messages_vendor_insert on public.quote_messages;
create policy quote_messages_vendor_insert on public.quote_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and sender_role = 'vendor'
    and exists (
      select 1
      from public.quotes q
      join public.vendors v on v.id = q.vendor_id
      where q.id = quote_messages.quote_id
        and v.owner_id = auth.uid()
    )
  );
