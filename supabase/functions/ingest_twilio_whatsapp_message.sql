begin;

alter table public.conversations add column if not exists external_thread_id text;
alter table public.conversations add column if not exists business_phone_number text;
alter table public.conversations add column if not exists twilio_account_sid text;

create unique index if not exists conversations_external_thread_id_key
  on public.conversations (external_thread_id);

create index if not exists conversations_business_phone_number_idx
  on public.conversations (business_phone_number);

create index if not exists conversations_twilio_account_sid_idx
  on public.conversations (twilio_account_sid);

comment on column public.conversations.external_thread_id is
  'Stable upstream thread key for Twilio Conversations or Programmable Messaging.';

comment on column public.conversations.business_phone_number is
  'The Twilio WhatsApp sender/business number that received the inbound message.';

comment on column public.conversations.twilio_account_sid is
  'Twilio AccountSid attached to the incoming webhook payload.';

create or replace function public.ingest_twilio_whatsapp_message(
  payload jsonb,
  request_headers jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_from text := nullif(payload ->> 'From', '');
  v_to text := nullif(payload ->> 'To', '');
  v_body text := coalesce(payload ->> 'Body', '');
  v_profile_name text := nullif(payload ->> 'ProfileName', '');
  v_account_sid text := nullif(payload ->> 'AccountSid', '');
  v_conversation_sid text := nullif(payload ->> 'ConversationSid', '');
  v_message_sid text := coalesce(
    nullif(payload ->> 'MessageSid', ''),
    nullif(payload ->> 'SmsMessageSid', ''),
    nullif(payload ->> 'SmsSid', '')
  );
  v_thread_key text;
  v_num_media int := 0;
  v_media jsonb := '[]'::jsonb;
  v_contact_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
  i int;
begin
  if v_from is null or v_to is null then
    raise exception 'Twilio payload must include From and To';
  end if;

  if coalesce(payload ->> 'NumMedia', '') ~ '^\d+$' then
    v_num_media := (payload ->> 'NumMedia')::int;
  end if;

  if v_num_media > 0 then
    for i in 0..(v_num_media - 1) loop
      v_media := v_media || jsonb_build_object(
        'index', i,
        'url', payload ->> ('MediaUrl' || i),
        'content_type', payload ->> ('MediaContentType' || i)
      );
    end loop;
  end if;

  if v_message_sid is null then
    v_message_sid := 'generated:' || md5(v_from || ':' || v_to || ':' || v_body || ':' || now()::text);
  end if;

  v_thread_key := coalesce(v_conversation_sid, 'twilio-messaging:' || v_to || ':' || v_from);

  insert into public.contacts (
    phone_number,
    whatsapp_id,
    display_name,
    last_seen_at,
    open_status
  )
  values (
    v_from,
    v_from,
    v_profile_name,
    now(),
    'open'
  )
  on conflict (phone_number) do update
    set whatsapp_id = coalesce(excluded.whatsapp_id, public.contacts.whatsapp_id),
        display_name = coalesce(excluded.display_name, public.contacts.display_name),
        last_seen_at = now(),
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
    twilio_conversation_sid,
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
    v_conversation_sid,
    v_to,
    v_account_sid,
    'open',
    now(),
    jsonb_build_object('source', 'twilio_webhook')
  )
  on conflict (external_thread_id) do update
    set contact_id = excluded.contact_id,
        business_phone_number = coalesce(excluded.business_phone_number, public.conversations.business_phone_number),
        twilio_account_sid = coalesce(excluded.twilio_account_sid, public.conversations.twilio_account_sid),
        status = case
          when public.conversations.status in ('closed', 'spam') then public.conversations.status
          else 'open'
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
    sent_at
  )
  values (
    v_conversation_id,
    v_contact_id,
    'inbound',
    'customer',
    'whatsapp',
    v_message_sid,
    v_message_sid,
    nullif(v_body, ''),
    v_media,
    jsonb_build_object('twilio', payload, 'headers', request_headers),
    now()
  )
  on conflict (twilio_message_sid) do update
    set raw_payload = excluded.raw_payload,
        media = excluded.media
  returning id into v_message_id;

  return jsonb_build_object(
    'contact_id', v_contact_id,
    'conversation_id', v_conversation_id,
    'message_id', v_message_id,
    'message_sid', v_message_sid,
    'thread_key', v_thread_key,
    'from', v_from,
    'to', v_to,
    'media_count', v_num_media
  );
end;
$$;

revoke all on function public.ingest_twilio_whatsapp_message(jsonb, jsonb)
  from public, anon, authenticated;

grant execute on function public.ingest_twilio_whatsapp_message(jsonb, jsonb)
  to service_role;

commit;
