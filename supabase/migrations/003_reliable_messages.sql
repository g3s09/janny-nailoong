-- Apply after 001, before deploying the message API. Does not depend on push.
begin;
alter table public.messages add column request_id uuid;
create unique index messages_sender_request on public.messages(sender_id,request_id) where request_id is not null;
create index messages_history_cursor on public.messages(deliver_at desc,id desc);

create function public.send_private_message(request_key uuid, recipient uuid, message_body text, file_path text default null, file_type text default null, special boolean default false, delivery timestamptz default now())
returns public.messages language plpgsql security definer set search_path='' as $$
declare result public.messages; sender uuid := auth.uid();
begin
  if sender is null or not public.is_member() then raise exception 'Unauthorized' using errcode='42501'; end if;
  if request_key is null then raise exception 'Missing request key' using errcode='22023'; end if;
  -- Serialize retries from multiple tabs as well as concurrent network requests.
  perform pg_advisory_xact_lock(hashtextextended(sender::text || request_key::text,0));
  select * into result from public.messages where sender_id=sender and request_id=request_key;
  if found then return result; end if;
  if recipient is null or recipient=sender or not exists(select 1 from public.profiles where id=recipient) then raise exception 'Invalid recipient' using errcode='22023'; end if;
  if message_body is null or length(message_body)>10000 or (length(trim(message_body))=0 and file_path is null) then raise exception 'Invalid message' using errcode='22023'; end if;
  if delivery is null or not isfinite(delivery) or special is null then raise exception 'Invalid delivery' using errcode='22023'; end if;
  if not public.is_gela() and (special or delivery>now()+interval '1 minute') then raise exception 'Not allowed' using errcode='42501'; end if;
  if file_path is null and file_type is not null then raise exception 'Missing attachment' using errcode='22023'; end if;
  if file_path is not null then
    if split_part(file_path,'/',1)<>sender::text or file_type is null
      or file_type not in ('image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/ogg','audio/webm','audio/wav')
      or not exists(select 1 from storage.objects where bucket_id='keepsakes' and name=file_path) then
      raise exception 'Invalid attachment' using errcode='22023';
    end if;
  end if;
  insert into public.messages(sender_id,recipient_id,body,attachment,attachment_type,important,deliver_at,request_id)
  values(sender,recipient,trim(message_body),file_path,file_type,special,delivery,request_key) returning * into result;
  return result;
end; $$;
revoke all on function public.send_private_message(uuid,uuid,text,text,text,boolean,timestamptz) from public,anon;
grant execute on function public.send_private_message(uuid,uuid,text,text,text,boolean,timestamptz) to authenticated;
-- Legacy clients remain compatible until deployment; apply 005 after switching the UI.
commit;
