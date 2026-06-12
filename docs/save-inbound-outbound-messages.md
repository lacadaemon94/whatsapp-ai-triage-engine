# Save Inbound and Outbound Messages

Inbound messages are saved by the active n8n workflow:

```txt
Twilio Incoming WhatsApp to Supabase
https://n8n.example.com/webhook/twilio/incoming-whatsapp
```

Outbound replies are sent and saved by:

```txt
Twilio Send WhatsApp Reply and Save Outbound
Workflow ID: <workflow-id>
https://n8n.example.com/webhook/twilio/send-whatsapp-reply
```

Delivery status callbacks are handled by:

```txt
Twilio Message Status to Supabase
Workflow ID: <workflow-id>
https://n8n.example.com/webhook/twilio/message-status
```

## Outbound Reply Request

Send JSON to the reply webhook:

```bash
curl -X POST "https://n8n.example.com/webhook/twilio/send-whatsapp-reply" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "whatsapp:+15550000001",
    "body": "Claro, para este sabado necesito saber cuantas personas serian.",
    "sender_type": "ai"
  }'
```

Supported request fields:

- `to`: customer WhatsApp address, with or without the `whatsapp:` prefix
- `body`: outbound message text
- `from`: optional business WhatsApp sender, defaults to `whatsapp:+15550100000`
- `sender_type`: optional `ai` or `human`, defaults to `ai`
- `external_thread_id`: optional stable conversation key
- `status_callback`: optional Twilio status callback URL

## Supabase Writes

Inbound:

- `contacts`: upserted by customer phone number
- `conversations`: upserted by Twilio thread key
- `messages`: inserted with `direction = 'inbound'`

Outbound:

- `contacts`: upserted by recipient phone number
- `conversations`: upserted by `external_thread_id`
- `messages`: inserted with `direction = 'outbound'`
- `messages.delivery_status`: initialized from Twilio's send response
- `messages.status_updated_at`: updated when Twilio sends status callbacks

## Credentials

n8n stores API credentials in encrypted credentials:

```txt
Supabase service role headers - WhatsApp triage
Twilio API basic auth - WhatsApp triage
```

Local reusable secrets live in `.env`, which is ignored by git. `.env.example` remains safe to commit.
