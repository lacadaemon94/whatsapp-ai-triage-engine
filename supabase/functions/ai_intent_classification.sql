begin;

create or replace function public.get_whatsapp_classification_context(
  p_message_id uuid,
  p_recent_limit int default 10
)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  with target_message as (
    select m.*
    from public.messages m
    where m.id = p_message_id
    limit 1
  ), target_conversation as (
    select conv.*
    from public.conversations conv
    join target_message tm on tm.conversation_id = conv.id
  ), target_contact as (
    select c.*
    from public.contacts c
    join target_message tm on tm.contact_id = c.id
  ), recent_messages as (
    select m.id,
           m.direction,
           m.sender_type,
           m.body,
           m.sent_at,
           m.delivery_status
    from public.messages m
    join target_message tm on tm.conversation_id = m.conversation_id
    order by m.sent_at desc, m.created_at desc
    limit greatest(1, least(coalesce(p_recent_limit, 10), 20))
  ), ordered_recent_messages as (
    select *
    from recent_messages
    order by sent_at asc
  )
  select jsonb_build_object(
    'message', (
      select jsonb_build_object(
        'id', tm.id,
        'direction', tm.direction,
        'sender_type', tm.sender_type,
        'body', tm.body,
        'sent_at', tm.sent_at,
        'raw_payload', tm.raw_payload
      )
      from target_message tm
    ),
    'contact', (
      select jsonb_build_object(
        'id', tc.id,
        'phone_number', tc.phone_number,
        'display_name', tc.display_name,
        'last_intent', tc.last_intent,
        'conversation_summary', tc.conversation_summary,
        'open_status', tc.open_status,
        'lead_score', tc.lead_score,
        'tags', tc.tags,
        'metadata', tc.metadata
      )
      from target_contact tc
    ),
    'conversation', (
      select jsonb_build_object(
        'id', tv.id,
        'status', tv.status,
        'priority', tv.priority,
        'last_intent', tv.last_intent,
        'summary', tv.summary,
        'external_thread_id', tv.external_thread_id,
        'business_phone_number', tv.business_phone_number,
        'last_message_at', tv.last_message_at,
        'metadata', tv.metadata
      )
      from target_conversation tv
    ),
    'recent_messages', coalesce((
      select jsonb_agg(to_jsonb(orm))
      from ordered_recent_messages orm
    ), '[]'::jsonb)
  )
  where exists (select 1 from target_message);
$$;

create or replace function public.save_ai_classification(
  payload jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_message_id uuid := nullif(payload ->> 'message_id', '')::uuid;
  v_conversation_id uuid := nullif(payload ->> 'conversation_id', '')::uuid;
  v_contact_id uuid := nullif(payload ->> 'contact_id', '')::uuid;
  v_intent text := coalesce(nullif(payload ->> 'intent', ''), 'unknown');
  v_confidence numeric := coalesce(nullif(payload ->> 'confidence', '')::numeric, 0);
  v_urgency text := coalesce(nullif(payload ->> 'urgency', ''), 'medium');
  v_summary text := nullif(payload ->> 'summary', '');
  v_recommended_action text := nullif(payload ->> 'recommended_action', '');
  v_model text := nullif(payload ->> 'model', '');
  v_prompt_version text := coalesce(nullif(payload ->> 'prompt_version', ''), 'intent-classifier-v1');
  v_input_context jsonb := coalesce(payload -> 'input_context', '{}'::jsonb);
  v_raw_response jsonb := coalesce(payload -> 'raw_response', '{}'::jsonb);
  v_missing_fields jsonb := coalesce(payload -> 'missing_fields', '[]'::jsonb);
  v_classification_id uuid;
  v_lead_score_delta smallint := 0;
begin
  if v_message_id is null then
    raise exception 'Classification payload must include message_id';
  end if;

  select m.conversation_id, m.contact_id
  into v_conversation_id, v_contact_id
  from public.messages m
  where m.id = v_message_id;

  if v_conversation_id is null or v_contact_id is null then
    raise exception 'No message found for message_id %', v_message_id;
  end if;

  if v_intent not in ('sales_lead', 'support_faq', 'reservation_booking', 'human_escalation', 'spam_noise', 'unknown') then
    v_intent := 'unknown';
  end if;

  if v_urgency not in ('low', 'medium', 'high') then
    v_urgency := 'medium';
  end if;

  v_confidence := greatest(0, least(v_confidence, 1));

  insert into public.ai_classifications (
    message_id,
    conversation_id,
    contact_id,
    intent,
    confidence,
    urgency,
    summary,
    recommended_action,
    model,
    prompt_version,
    input_context,
    raw_response
  )
  values (
    v_message_id,
    v_conversation_id,
    v_contact_id,
    v_intent,
    v_confidence,
    v_urgency,
    v_summary,
    v_recommended_action,
    v_model,
    v_prompt_version,
    v_input_context,
    v_raw_response
  )
  returning id into v_classification_id;

  v_lead_score_delta := case
    when v_intent = 'reservation_booking' then 20
    when v_intent = 'sales_lead' then 15
    when v_intent = 'human_escalation' then 5
    when v_intent = 'spam_noise' then -20
    else 0
  end;

  update public.contacts
  set last_intent = v_intent,
      conversation_summary = coalesce(v_summary, conversation_summary),
      lead_score = greatest(0, least(100, lead_score + v_lead_score_delta)),
      open_status = case when v_intent = 'spam_noise' then 'spam' else open_status end,
      updated_at = now()
  where id = v_contact_id;

  update public.conversations
  set last_intent = v_intent,
      summary = coalesce(v_summary, summary),
      priority = case when v_urgency = 'high' then 'high' else priority end,
      status = case
        when v_intent = 'human_escalation' then 'waiting_on_human'
        when v_intent = 'spam_noise' then 'spam'
        else status
      end,
      updated_at = now()
  where id = v_conversation_id;

  if v_intent in ('sales_lead', 'reservation_booking') then
    insert into public.lead_events (
      contact_id,
      conversation_id,
      message_id,
      event_type,
      status,
      score_delta,
      extracted_fields,
      notes
    )
    values (
      v_contact_id,
      v_conversation_id,
      v_message_id,
      v_intent || '_classified',
      'new',
      v_lead_score_delta,
      jsonb_build_object('missing_fields', v_missing_fields, 'recommended_action', v_recommended_action),
      v_summary
    );
  end if;

  if v_intent = 'human_escalation' then
    insert into public.handoff_requests (
      contact_id,
      conversation_id,
      message_id,
      reason,
      priority,
      requested_by,
      metadata
    )
    values (
      v_contact_id,
      v_conversation_id,
      v_message_id,
      coalesce(v_summary, 'AI classified conversation as needing human escalation.'),
      case when v_urgency = 'high' then 'high' else 'normal' end,
      'ai',
      jsonb_build_object('classification_id', v_classification_id, 'recommended_action', v_recommended_action)
    );
  end if;

  return jsonb_build_object(
    'classification_id', v_classification_id,
    'message_id', v_message_id,
    'conversation_id', v_conversation_id,
    'contact_id', v_contact_id,
    'intent', v_intent,
    'confidence', v_confidence,
    'urgency', v_urgency,
    'lead_score_delta', v_lead_score_delta
  );
end;
$$;

revoke all on function public.get_whatsapp_classification_context(uuid, int)
  from public, anon, authenticated;

revoke all on function public.save_ai_classification(jsonb)
  from public, anon, authenticated;

grant execute on function public.get_whatsapp_classification_context(uuid, int)
  to service_role;

grant execute on function public.save_ai_classification(jsonb)
  to service_role;

commit;
