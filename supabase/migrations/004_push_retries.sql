-- Optional push upgrade; apply after 002. Does not change account access.
begin;
create function public.enqueue_scheduled_push_subscription() returns trigger language plpgsql security definer set search_path='' as $$
begin
  -- Enabling notifications after a letter was scheduled must not lose its notice.
  insert into public.push_jobs(message_id,endpoint,available_at)
  select id,new.endpoint,deliver_at from public.messages
  where recipient_id=new.owner_id and read_at is null and deliver_at>now()
  on conflict(message_id,endpoint) do nothing;
  return new;
end; $$;
revoke all on function public.enqueue_scheduled_push_subscription() from public,anon,authenticated;
create trigger enqueue_scheduled_push_subscription after insert on public.push_subscriptions
for each row execute function public.enqueue_scheduled_push_subscription();

create or replace function public.claim_push_jobs(sender_filter uuid default null)
returns table(id uuid,message_id uuid,endpoint text,p256dh text,auth text,claim_token uuid,attempts int)
language plpgsql security definer set search_path='' as $$
begin
  delete from public.push_jobs j using public.messages m
  where j.message_id=m.id and (m.read_at is not null or m.deliver_at<now()-interval '1 day' or (j.attempts>=5 and j.available_at<=now()));
  return query
  with candidates as (
    select j.id from public.push_jobs j
    join public.messages m on m.id=j.message_id
    join public.push_subscriptions s on s.endpoint=j.endpoint and s.owner_id=m.recipient_id
    where j.available_at<=now() and m.deliver_at<=now() and m.read_at is null
      and m.deliver_at>now()-interval '1 day' and j.attempts<5
      and (sender_filter is null or m.sender_id=sender_filter)
    order by j.available_at limit 5 for update of j skip locked
  ), claimed as (
    update public.push_jobs j set available_at=now()+interval '2 minutes',attempts=j.attempts+1,claim_token=gen_random_uuid()
    from candidates c where j.id=c.id returning j.*
  ) select c.id,c.message_id,c.endpoint,s.p256dh,s.auth,c.claim_token,c.attempts
  from claimed c join public.push_subscriptions s on s.endpoint=c.endpoint;
end; $$;
revoke all on function public.claim_push_jobs(uuid) from public,anon,authenticated;
grant execute on function public.claim_push_jobs(uuid) to service_role;
commit;
