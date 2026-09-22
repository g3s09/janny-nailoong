-- Optional: run after migration 002 and configuring the production server.
-- Store PUSH_DISPATCH_SECRET in Supabase Vault as janny_push_dispatch_secret.
-- Never put its value in this file, Git, or the cron command itself.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule('janny-private-push', '* * * * *', $job$
  select net.http_post(
    url := 'https://janny-nailoong.vercel.app/api/push/dispatch',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='janny_push_dispatch_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  ) where exists(select 1 from public.push_jobs where available_at<=now() and attempts<5)
    and exists(select 1 from vault.decrypted_secrets where name='janny_push_dispatch_secret');
$job$);

-- Retain no completed/read/expired queue entries indefinitely.
select cron.schedule('janny-private-push-cleanup', '17 4 * * *', $job$
  delete from public.push_jobs j using public.messages m
  where j.message_id=m.id and (m.read_at is not null or m.deliver_at<now()-interval '1 day' or j.attempts>=5);
$job$);
