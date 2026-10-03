begin;
alter table public.messages add column if not exists reply_to uuid references public.messages(id) on delete set null;
alter table public.messages add column if not exists kind text not null default 'text' check (kind in ('text','hug'));
create table if not exists public.message_hearts (
  message_id uuid not null references public.messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key(message_id,profile_id)
);
alter table public.message_hearts enable row level security;
revoke all on public.message_hearts from anon,authenticated;
grant select,insert,delete on public.message_hearts to authenticated;
create policy read_hearts on public.message_hearts for select to authenticated using (public.is_member() and exists(select 1 from public.messages m where m.id=message_id and m.deliver_at<=now() and auth.uid() in (m.sender_id,m.recipient_id)));
create policy add_heart on public.message_hearts for insert to authenticated with check (profile_id=auth.uid() and public.is_member() and exists(select 1 from public.messages m where m.id=message_id and m.deliver_at<=now() and auth.uid() in (m.sender_id,m.recipient_id)));
create policy remove_heart on public.message_hearts for delete to authenticated using(profile_id=auth.uid() and public.is_member());
create table if not exists public.chat_typing (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  until_at timestamptz not null default now()
);
alter table public.chat_typing enable row level security;
revoke all on public.chat_typing from anon,authenticated;
grant select on public.chat_typing to authenticated;
create policy read_typing on public.chat_typing for select to authenticated using(public.is_member());
create or replace function public.set_chat_typing(active boolean) returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_member() then raise exception 'Unauthorized' using errcode='42501'; end if;
  insert into public.chat_typing(profile_id,until_at) values(auth.uid(),now()+case when active then interval '7 seconds' else interval '0 seconds' end)
  on conflict(profile_id) do update set until_at=excluded.until_at;
end; $$;
revoke all on function public.set_chat_typing(boolean) from public,anon;
grant execute on function public.set_chat_typing(boolean) to authenticated;
create or replace function public.send_private_message_v2(request_key uuid,recipient uuid,message_body text,file_path text default null,file_type text default null,special boolean default false,delivery timestamptz default now(),reply uuid default null,message_kind text default 'text')
returns public.messages language plpgsql security definer set search_path='' as $$
declare result public.messages; sender uuid:=auth.uid();
begin
  if sender is null or not public.is_member() then raise exception 'Unauthorized' using errcode='42501'; end if;
  if request_key is null then raise exception 'Missing request' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(sender::text || request_key::text,0));
  select * into result from public.messages where sender_id=sender and request_id=request_key;
  if found then return result; end if;
  if message_kind is null or message_kind not in ('text','hug') then raise exception 'Invalid kind' using errcode='22023'; end if;
  if reply is not null and not exists(select 1 from public.messages where id=reply and deliver_at<=now() and ((sender_id=sender and recipient_id=recipient) or (sender_id=recipient and recipient_id=sender))) then raise exception 'Invalid reply' using errcode='22023'; end if;
  select * into result from public.send_private_message(request_key,recipient,message_body,file_path,file_type,special,delivery);
  update public.messages set reply_to=reply,kind=message_kind where id=result.id returning * into result;
  return result;
end; $$;
revoke all on function public.send_private_message_v2(uuid,uuid,text,text,text,boolean,timestamptz,uuid,text) from public,anon;
grant execute on function public.send_private_message_v2(uuid,uuid,text,text,text,boolean,timestamptz,uuid,text) to authenticated;
commit;
