-- Run once after 001. Subscriptions never expose message contents.
create table public.push_subscriptions (
 endpoint text primary key check(length(endpoint)<=2048),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 p256dh text not null, auth text not null,
 created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select,insert,update,delete on public.push_subscriptions to authenticated;
create policy own_push on public.push_subscriptions for all to authenticated
 using(owner_id=auth.uid() and public.is_member())
 with check(owner_id=auth.uid() and public.is_member());
create table public.push_jobs (
 id uuid primary key default gen_random_uuid(),
 message_id uuid not null references public.messages(id) on delete cascade,
 endpoint text not null references public.push_subscriptions(endpoint) on delete cascade,
 available_at timestamptz not null, attempts int not null default 0,
 claim_token uuid, unique(message_id,endpoint)
);
alter table public.push_jobs enable row level security;
revoke all on public.push_jobs from anon,authenticated;
grant all on public.push_jobs,public.push_subscriptions to service_role;
create index push_jobs_due on public.push_jobs(available_at) where attempts<5;
create function public.enqueue_private_push() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.push_jobs(message_id,endpoint,available_at)
 select new.id,s.endpoint,new.deliver_at from public.push_subscriptions s where s.owner_id=new.recipient_id;
 return new;
end; $$;
revoke all on function public.enqueue_private_push() from public,anon,authenticated;
create trigger enqueue_private_push after insert on public.messages for each row execute function public.enqueue_private_push();
create function public.claim_push_jobs(sender_filter uuid default null)
returns table(id uuid,message_id uuid,endpoint text,p256dh text,auth text,claim_token uuid,attempts int)
language sql security definer set search_path='' as $$
 with candidates as (
 select j.id from public.push_jobs j join public.messages m on m.id=j.message_id
 where j.available_at<=now() and m.deliver_at<=now() and m.read_at is null
 and m.deliver_at>now()-interval '1 day' and j.attempts<5
 and (sender_filter is null or m.sender_id=sender_filter)
 order by j.available_at limit 5 for update of j skip locked
 ), claimed as (
 update public.push_jobs j set available_at=now()+interval '2 minutes', attempts=j.attempts+1,claim_token=gen_random_uuid()
 from candidates c where j.id=c.id returning j.*
 ) select c.id,c.message_id,c.endpoint,s.p256dh,s.auth,c.claim_token,c.attempts
 from claimed c join public.push_subscriptions s on s.endpoint=c.endpoint;
$$;
revoke all on function public.claim_push_jobs(uuid) from public,anon,authenticated;
grant execute on function public.claim_push_jobs(uuid) to service_role;
