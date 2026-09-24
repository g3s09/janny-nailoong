-- Apply AFTER deploying the new /api/messages client, and after 003.
-- All sends then go through send_private_message; existing read policies remain.
revoke insert(sender_id,recipient_id,body,attachment,attachment_type,important,deliver_at) on public.messages from authenticated;
