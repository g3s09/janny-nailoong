begin;
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.profiles add column if not exists avatar_path text;
create table public.message_favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  primary key(profile_id,message_id)
);
alter table public.message_favorites enable row level security;
revoke all on public.message_favorites from anon,authenticated;
grant select,insert,delete on public.message_favorites to authenticated;
create policy own_favorites on public.message_favorites for select to authenticated using(profile_id=auth.uid() and public.is_member());
create policy add_favorite on public.message_favorites for insert to authenticated with check(profile_id=auth.uid() and public.is_member() and exists(select 1 from public.messages m where m.id=message_id and m.deliver_at<=now() and auth.uid() in (m.sender_id,m.recipient_id)));
create policy remove_favorite on public.message_favorites for delete to authenticated using(profile_id=auth.uid() and public.is_member());
create function public.edit_chat_message(message uuid,new_body text,expected_body text) returns public.messages language plpgsql security definer set search_path='' as $$
declare result public.messages;
begin
 if not public.is_member() then raise exception 'Unauthorized' using errcode='42501'; end if;
 select * into result from public.messages where id=message and sender_id=auth.uid() for update;
 if not found or result.kind<>'text' then raise exception 'No puedes editar este mensaje.' using errcode='42501'; end if;
 if result.body is distinct from expected_body then raise exception 'Este mensaje cambió. Vuelve a abrirlo antes de editar.' using errcode='40001'; end if;
 if new_body is null or length(new_body)>10000 or (length(trim(new_body))=0 and result.attachment is null) then raise exception 'Escribe un mensaje válido.' using errcode='22023'; end if;
 update public.messages set body=trim(new_body),edited_at=clock_timestamp() where id=message returning * into result;
 return result;
end; $$;
revoke all on function public.edit_chat_message(uuid,text,text) from public,anon;
grant execute on function public.edit_chat_message(uuid,text,text) to authenticated;
create function public.set_profile_avatar(file_path text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_member() then raise exception 'Unauthorized' using errcode='42501'; end if;
 if file_path is not null and (split_part(file_path,'/',1)<>auth.uid()::text or file_path !~ '\.(jpeg|png|webp|gif)$' or not exists(select 1 from storage.objects where bucket_id='keepsakes' and name=file_path)) then raise exception 'Invalid avatar' using errcode='22023'; end if;
 update public.profiles set avatar_path=file_path where id=auth.uid();
end; $$;
revoke all on function public.set_profile_avatar(text) from public,anon;
grant execute on function public.set_profile_avatar(text) to authenticated;
create policy read_profile_avatar on storage.objects for select to authenticated using(bucket_id='keepsakes' and public.is_member() and exists(select 1 from public.profiles p where p.avatar_path=storage.objects.name));
commit;
