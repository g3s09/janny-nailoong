-- Run once in a new Supabase project's SQL editor. No public sign-up trigger.
begin;
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, name text not null check(length(name) between 1 and 60), role text not null unique check(role in ('janny','gela')));
create function public.is_member() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.profiles where id = auth.uid()); $$;
create function public.is_gela() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'gela'); $$;
create table public.messages (id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.profiles(id), recipient_id uuid not null references public.profiles(id), body text not null default '' check(length(body)<=10000), attachment text, attachment_type text, important boolean not null default false, created_at timestamptz not null default now(), deliver_at timestamptz not null default now(), read_at timestamptz, check(sender_id<>recipient_id), check(length(trim(body))>0 or attachment is not null));
create table public.memories (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), title text not null check(length(title) between 1 and 160), body text not null default '' check(length(body)<=10000), date date not null default current_date, place text not null default '' check(length(place)<=200), attachment text, audio text);
create table public.moods (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), day date not null default (now() at time zone 'America/Mexico_City')::date, mood smallint not null check(mood between 0 and 6), note text not null default '' check(length(note)<=10000), unique(owner_id,day));
create table public.open_when (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), title text not null check(length(title) between 1 and 160), body text not null check(length(body) between 1 and 10000), attachment text, audio text, once boolean not null default false, opened_at timestamptz, available_at timestamptz not null default now());
create table public.events (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), title text not null check(length(title) between 1 and 160), body text not null default '' check(length(body)<=10000), day date not null, annual boolean not null default false, decoration text not null default 'stars' check(decoration in ('stars','flowers','hearts','birthday','winter')));
create table public.coins (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), amount int not null, reason text not null, created_at timestamptz not null default now(), unique(owner_id,reason));
create table public.unlocks (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), item text not null, created_at timestamptz not null default now(), unique(owner_id,item));
create table public.visits (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), day date not null default (now() at time zone 'America/Mexico_City')::date, unique(owner_id,day));
create table public.notifications (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), message_id uuid unique references public.messages(id) on delete cascade, body text not null, created_at timestamptz not null default now(), read_at timestamptz);
create table public.phrases (id uuid primary key default gen_random_uuid(), body text not null check(length(body) between 1 and 300), state text not null default 'idle' check(state in ('idle','happy','thinking','sleepy','laugh','surprised')));
create index messages_recipient_delivery on public.messages(recipient_id,deliver_at);
create index messages_sender on public.messages(sender_id);
create index moods_owner_day on public.moods(owner_id,day);
create index notifications_owner on public.notifications(owner_id);

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.moods enable row level security;
alter table public.open_when enable row level security;
alter table public.events enable row level security;
alter table public.coins enable row level security;
alter table public.unlocks enable row level security;
alter table public.visits enable row level security;
alter table public.notifications enable row level security;
alter table public.phrases enable row level security;
revoke all on public.profiles,public.messages,public.memories,public.moods,public.open_when,public.events,public.coins,public.unlocks,public.visits,public.notifications,public.phrases from anon,authenticated;
grant select on public.profiles,public.messages,public.memories,public.moods,public.open_when,public.events,public.coins,public.unlocks,public.visits,public.notifications,public.phrases to authenticated;
grant insert (sender_id,recipient_id,body,attachment,attachment_type,important,deliver_at) on public.messages to authenticated;
grant insert,update,delete on public.memories,public.moods,public.open_when,public.events,public.phrases to authenticated;
create policy member_profiles on public.profiles for select to authenticated using(public.is_member());
create policy read_messages on public.messages for select to authenticated using(sender_id=auth.uid() or (recipient_id=auth.uid() and deliver_at<=now()));
create policy send_messages on public.messages for insert to authenticated with check(public.is_member() and sender_id=auth.uid() and (public.is_gela() or (important=false and deliver_at<=now()+interval '1 minute')));
create policy read_memories on public.memories for select to authenticated using(owner_id=auth.uid() or public.is_gela());
create policy create_memories on public.memories for insert to authenticated with check(public.is_member() and (owner_id=auth.uid() or public.is_gela()));
create policy edit_memories on public.memories for update to authenticated using(owner_id=auth.uid() or public.is_gela()) with check(owner_id=auth.uid() or public.is_gela());
create policy delete_memories on public.memories for delete to authenticated using(owner_id=auth.uid() or public.is_gela());
-- A diary is private to its author, including from Gela.
create policy own_moods on public.moods for all to authenticated using(owner_id=auth.uid() and public.is_member()) with check(owner_id=auth.uid() and public.is_member());
create policy read_letters on public.open_when for select to authenticated using((owner_id=auth.uid() and available_at<=now()) or public.is_gela());
create policy admin_letters on public.open_when for all to authenticated using(public.is_gela()) with check(public.is_gela());
create policy read_events on public.events for select to authenticated using(owner_id=auth.uid() or public.is_gela());
create policy admin_events on public.events for all to authenticated using(public.is_gela()) with check(public.is_gela());
create policy own_coins on public.coins for select to authenticated using(owner_id=auth.uid());
create policy own_unlocks on public.unlocks for select to authenticated using(owner_id=auth.uid());
create policy own_visits on public.visits for select to authenticated using(owner_id=auth.uid());
create policy own_notices on public.notifications for select to authenticated using(owner_id=auth.uid());
create policy read_phrases on public.phrases for select to authenticated using(public.is_member());
create policy admin_phrases on public.phrases for all to authenticated using(public.is_gela()) with check(public.is_gela());

create function public.mark_message_read(message uuid) returns void language plpgsql security definer set search_path='' as $$ begin
  update public.messages set read_at=coalesce(read_at,now()) where id=message and recipient_id=auth.uid() and deliver_at<=now();
  update public.notifications set read_at=coalesce(read_at,now()) where message_id=message and owner_id=auth.uid();
end; $$;
create function public.open_letter(letter uuid) returns void language plpgsql security definer set search_path='' as $$ begin
  update public.open_when set opened_at=coalesce(opened_at,now()) where id=letter and owner_id=auth.uid() and available_at<=now();
end; $$;
-- Notification production also supports scheduled letters without exposing future content.
create function public.deliver_messages() returns void language plpgsql security definer set search_path='' as $$ begin
  if not public.is_member() then raise exception 'Unauthorized'; end if;
  insert into public.notifications(owner_id,message_id,body)
    select recipient_id,id,case when important then 'Hay una carta especial para ti.' else 'Tienes una carta nueva.' end
    from public.messages where recipient_id=auth.uid() and deliver_at<=now() on conflict(message_id) do nothing;
end; $$;
create function public.record_visit() returns void language plpgsql security definer set search_path='' as $$ declare d date := (now() at time zone 'America/Mexico_City')::date; begin
  if not public.is_member() then raise exception 'Unauthorized'; end if;
  insert into public.visits(owner_id,day) values(auth.uid(),d) on conflict do nothing;
  insert into public.coins(owner_id,amount,reason) values(auth.uid(),10,'visit:'||d) on conflict do nothing;
end; $$;
create function public.reward_activity(activity text, reference_id uuid default null) returns void language plpgsql security definer set search_path='' as $$ declare reason_key text; begin
  if not public.is_member() then raise exception 'Unauthorized'; end if;
  if activity='care' then reason_key := 'care:'||((now() at time zone 'America/Mexico_City')::date)::text;
  elsif activity='secret' then reason_key := 'secret:plant';
  elsif activity='memory' and exists(select 1 from public.memories where id=reference_id and owner_id=auth.uid()) then reason_key := 'memory:'||reference_id;
  else raise exception 'Invalid reward'; end if;
  insert into public.coins(owner_id,amount,reason) values(auth.uid(),3,reason_key) on conflict do nothing;
end; $$;
create function public.purchase(item_name text) returns void language plpgsql security definer set search_path='' as $$ declare cost int; balance int; permanent boolean; begin
  if not public.is_member() then raise exception 'Unauthorized'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  cost := case item_name when 'cookie' then 3 when 'fruit' then 4 when 'pizza' then 6 when 'cake' then 7 when 'ramen' then 8 when 'dumpling' then 6 when 'scarf' then 20 when 'flower' then 15 when 'kitchen' then 25 when 'garden' then 35 when 'roof' then 45 when 'space' then 60 end;
  if cost is null then raise exception 'Unknown item'; end if;
  permanent := item_name in ('scarf','flower','kitchen','garden','roof','space');
  if permanent and exists(select 1 from public.unlocks where owner_id=auth.uid() and item=item_name) then raise exception 'Ya tienes este detalle.'; end if;
  select coalesce(sum(amount),0) into balance from public.coins where owner_id=auth.uid();
  if balance<cost then raise exception 'Todavía faltan Nailocoins. No hay prisa.'; end if;
  insert into public.coins(owner_id,amount,reason) values(auth.uid(),-cost,'purchase:'||item_name||':'||gen_random_uuid());
  if permanent then insert into public.unlocks(owner_id,item) values(auth.uid(),item_name); end if;
end; $$;
revoke execute on function public.is_member(),public.is_gela(),public.mark_message_read(uuid),public.open_letter(uuid),public.deliver_messages(),public.record_visit(),public.reward_activity(text,uuid),public.purchase(text) from public,anon;
grant execute on function public.is_member(),public.is_gela(),public.mark_message_read(uuid),public.open_letter(uuid),public.deliver_messages(),public.record_visit(),public.reward_activity(text,uuid),public.purchase(text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('keepsakes','keepsakes',false,15728640,array['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/ogg','audio/webm','audio/wav']);
-- Attachments remain private, including scheduled content and diary isolation.
create policy upload_keepsakes on storage.objects for insert to authenticated with check(bucket_id='keepsakes' and public.is_member() and (storage.foldername(name))[1]=auth.uid()::text);
create policy delete_own_keepsakes on storage.objects for delete to authenticated using(bucket_id='keepsakes' and (storage.foldername(name))[1]=auth.uid()::text);
create policy read_keepsakes on storage.objects for select to authenticated using(bucket_id='keepsakes' and public.is_member() and (
  (storage.foldername(name))[1]=auth.uid()::text
  or exists(select 1 from public.messages m where m.attachment=name and m.recipient_id=auth.uid() and m.deliver_at<=now())
  or exists(select 1 from public.memories m where (m.attachment=name or m.audio=name) and (m.owner_id=auth.uid() or public.is_gela()))
  or exists(select 1 from public.open_when o where (o.attachment=name or o.audio=name) and o.owner_id=auth.uid() and o.available_at<=now())
));
alter publication supabase_realtime add table public.messages,public.notifications,public.memories,public.open_when,public.events;
commit;

