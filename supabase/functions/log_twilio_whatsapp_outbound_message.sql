begin;

alter table public.messages add column if not exists delivery_status text;
alter table public.messages add column if not exists error_code text;
alter table public.messages add column if not exists error_message text;
alter table public.messages add column if not exists status_updated_at timestamptz;

create index if not exists messages_delivery_status_idx
  on public.messages (delivery_status);

create index if not exists messages_status_updated_at_idx
  on public.messages (status_updated_at desc);

comment on column public.messages.delivery_status is
  'Latest Twilio delivery status for outbound messages, or null for inbound/internal rows.';

comment on column public.messages.error_code is
  'Latest Twilio error code associated with message delivery, when present.';

comment on column public.messages.error_message is
  'Latest Twilio error message associated with message delivery, when present.';

comment on column public.messages.status_updated_at is
  'Timestamp when delivery_status was last updated.';

create or replace function public.log_twilio_whatsapp_outbound_message(
  payload jsonb,
  request_context jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_from text := coalesce(
    nullif(payload ->> 'from', ''),
    nullif(payload ->> 'From', ''),
    nullif(request_context ->> 'from', ''),
    nullif(request_context ->> 'From', '')
  );
  v_to text := coalesce(
    nullif(payload ->> 'to', ''),
    nullif(payload ->> 'To', ''),
    nullif(request_context ->> 'to', ''),
    nullif(request_context ->> 'To', '')
  );
  v_body text := coalesce(
    payload ->> 'body',
    payload ->> 'Body',
    request_context ->> 'body',
    request_context ->> 'Body',
    ''
  );
  v_account_sid text := coalesce(
    nullif(payload ->> 'account_sid', ''),
    nullif(payload ->> 'AccountSid', ''),
    nullif(request_context ->> 'account_sid', ''),
    nullif(request_context ->> 'AccountSid', '')
  );
  v_message_sid text := coalesce(
    nullif(payload ->> 'sid', ''),
    nullif(payload ->> 'MessageSid', ''),
    nullif(request_context ->> 'message_sid', ''),
    nullif(request_context ->> 'MessageSid', '')
  );
  v_status text := coalesce(
    nullif(payload ->> 'status', ''),
    nullif(payload ->> 'MessageStatus', ''),
    nullif(request_context ->> 'status', ''),
    'queued'
  );
  v_sender_type text := coalesce(nullif(request_context ->> 'sender_type', ''), 'ai');
  v_thread_key text;
  v_media jsonb := '[]'::jsonb;
  v_contact_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
  v_sent_at timestamptz := now();
begin
  if v_from is null or v_to is null then
    raise exception 'Outbound payload must include from and to WhatsApp addresses';
  end if;

  if v_message_sid is null then
    v_message_sid := 'generated-outbound:' || md5(v_from || ':' || v_to || ':' || v_body || ':' || now()::text);
  end if;

  if request_context ? 'media' and jsonb_typeof(request_context -> 'media') = 'array' then
    v_media := request_context -> 'media';
  elsif payload ? 'subresource_uris' then
    v_media := jsonb_build_array(jsonb_build_object('source', 'twilio_subresource_uris', 'value', payload -> 'subresource_uris'));
  end if;

  v_thread_key := coalesce(
    nullif(request_context ->> 'external_thread_id', ''),
    nullif(request_context ->> 'thread_key', ''),
    'twilio-messaging:' || v_from || ':' || v_to
  );

  insert into public.contacts (
    phone_number,
    whatsapp_id,
    last_seen_at,
    open_status
  )
  values (
    v_to,
    v_to,
    now(),
    'open'
  )
  on conflict (phone_number) do update
    set whatsapp_id = coalesce(excluded.whatsapp_id, public.contacts.whatsapp_id),
        open_status = case
          when public.contacts.open_status = 'spam' then public.contacts.open_status
          else 'open'
        end,
        updated_at = now()
  returning id into v_contact_id;

  insert into public.conversations (
    contact_id,
    channel,
    external_thread_id,
    business_phone_number,
    twilio_account_sid,
    status,
    last_message_at,
    metadata
  )
  values (
    v_contact_id,
    'whatsapp',
    v_thread_key,
    v_from,
    v_account_sid,
    'waiting_on_customer',
    now(),
    jsonb_build_object('source', 'twilio_outbound_api')
  )
  on conflict (external_thread_id) do update
    set contact_id = excluded.contact_id,
        business_phone_number = coalesce(excluded.business_phone_number, public.conversations.business_phone_number),
        twilio_account_sid = coalesce(excluded.twilio_account_sid, public.conversations.twilio_account_sid),
        status = case
          when public.conversations.status = 'spam' then public.conversations.status
          else 'waiting_on_customer'
        end,
        last_message_at = now(),
        updated_at = now()
  returning id into v_conversation_id;

  insert into public.messages (
    conversation_id,
    contact_id,
    direction,
    sender_type,
    channel,
    twilio_message_sid,
    external_message_id,
    body,
    media,
    raw_payload,
    ai_generated,
    sent_at,
    delivery_status,
    error_code,
    error_message,
    status_updated_at
  )
  values (
    v_conversation_id,
    v_contact_id,
    'outbound',
    v_sender_type,
    'whatsapp',
    v_message_sid,
    v_message_sid,
    nullif(v_body, ''),
    v_media,
    jsonb_build_object('twilio', payload, 'request_context', request_context),
    v_sender_type = 'ai',
    v_sent_at,
    v_status,
    nullif(coalesce(payload ->> 'error_code', payload ->> 'ErrorCode', request_context ->> 'error_code'), ''),
    nullif(coalesce(payload ->> 'error_message', payload ->> 'ErrorMessage', request_context ->> 'error_message'), ''),
    now()
  )
  on conflict (twilio_message_sid) do update
    set raw_payload = public.messages.raw_payload || excluded.raw_payload,
        delivery_status = coalesce(excluded.delivery_status, public.messages.delivery_status),
        error_code = coalesce(excluded.error_code, public.messages.error_code),
        error_message = coalesce(excluded.error_message, public.messages.error_message),
        status_updated_at = now()
  returning id into v_message_id;

  return jsonb_build_object(
    'contact_id', v_contact_id,
    'conversation_id', v_conversation_id,
    'message_id', v_message_id,
    'message_sid', v_message_sid,
    'thread_key', v_thread_key,
    'from', v_from,
    'to', v_to,
    'delivery_status', v_status
  );
end;
$$;

create or replace function public.update_twilio_message_status(
  payload jsonb,
  request_headers jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_message_sid text := coalesce(
    nullif(payload ->> 'MessageSid', ''),
    nullif(payload ->> 'SmsSid', ''),
    nullif(payload ->> 'SmsMessageSid', ''),
    nullif(payload ->> 'sid', '')
  );
  v_status text := coalesce(
    nullif(payload ->> 'MessageStatus', ''),
    nullif(payload ->> 'SmsStatus', ''),
    nullif(payload ->> 'status', '')
  );
  v_message_id uuid;
begin
  if v_message_sid is null then
    raise exception 'Status payload must include MessageSid';
  end if;

  update public.messages
  set delivery_status = coalesce(v_status, delivery_status),
      error_code = nullif(coalesce(payload ->> 'ErrorCode', payload ->> 'error_code'), ''),
      error_message = nullif(coalesce(payload ->> 'ErrorMessage', payload ->> 'error_message'), ''),
      raw_payload = raw_payload || jsonb_build_object('status_callback', payload, 'status_callback_headers', request_headers),
      status_updated_at = now()
  where twilio_message_sid = v_message_sid
  returning id into v_message_id;

  return jsonb_build_object(
    'message_id', v_message_id,
    'message_sid', v_message_sid,
    'delivery_status', v_status,
    'updated', v_message_id is not null
  );
end;
$$;

revoke all on function public.log_twilio_whatsapp_outbound_message(jsonb, jsonb)
  from public, anon, authenticated;

revoke all on function public.update_twilio_message_status(jsonb, jsonb)
  from public, anon, authenticated;

grant execute on function public.log_twilio_whatsapp_outbound_message(jsonb, jsonb)
  to service_role;

grant execute on function public.update_twilio_message_status(jsonb, jsonb)
  to service_role;

commit;
