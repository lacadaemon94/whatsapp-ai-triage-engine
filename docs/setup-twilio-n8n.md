# Twilio Incoming WhatsApp Webhook to n8n

This workflow receives inbound WhatsApp messages from Twilio, normalizes the form-encoded webhook payload, calls Supabase to create or update the contact/conversation/message records, then returns an empty TwiML response to Twilio.

## Files

- `workflows/n8n-twilio-incoming-webhook.json`
- `supabase/functions/ingest_twilio_whatsapp_message.sql`

## n8n credential

The live workflow uses an n8n Custom Auth credential for Supabase service-role headers because this n8n instance blocks `$env` access inside nodes.

Created n8n credential:

```txt
Name: Supabase service role headers - WhatsApp triage
Type: Custom Auth
```

For a different n8n instance, create a Custom Auth credential with this JSON shape:

```json
{
  "headers": {
    "apikey": "your-service-role-key",
    "Authorization": "Bearer your-service-role-key"
  }
}
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Do not expose it in browser code.

## Import the workflow

1. In n8n, import `workflows/n8n-twilio-incoming-webhook.json`.
2. Open the `Twilio Incoming WhatsApp` webhook node.
3. Activate the workflow.
4. Use the production webhook URL, not the test URL.

The live production webhook URL is:

```txt
https://n8n.example.com/webhook/twilio/incoming-whatsapp
```

## Configure Twilio

In the Twilio Console, configure the WhatsApp sender incoming message webhook:

```txt
Webhook URL: https://n8n.example.com/webhook/twilio/incoming-whatsapp
HTTP method: POST
```

Current Twilio sender:

```txt
Sender: whatsapp:+15550100000
Sender SID: XE_YOUR_SENDER_SID
Status: ONLINE
Inbound webhook: https://n8n.example.com/webhook/twilio/incoming-whatsapp
Method: POST
```

Twilio sends inbound messaging webhooks as form data. For WhatsApp, `From` and `To` use the `whatsapp:+E164_NUMBER` format, `Body` contains the message text, and media arrives as `MediaUrl0`, `MediaContentType0`, plus `NumMedia`.

## Local webhook test

Use the n8n production URL after the workflow is active:

```bash
curl -X POST "https://n8n.example.com/webhook/twilio/incoming-whatsapp" \
  --data-urlencode "AccountSid=AC_TEST" \
  --data-urlencode "MessageSid=SM_TEST_001" \
  --data-urlencode "From=whatsapp:+15550000001" \
  --data-urlencode "To=whatsapp:+15550100000" \
  --data-urlencode "Body=Hola, cuanto cuesta para este sabado?" \
  --data-urlencode "ProfileName=Demo Contact" \
  --data-urlencode "NumMedia=0"
```

Expected result:

```xml
<Response></Response>
```

Expected Supabase writes:

- `contacts`: upserted by `phone_number`
- `conversations`: upserted by `external_thread_id`
- `messages`: inserted or deduplicated by `twilio_message_sid`

## Production hardening

Add Twilio request signature validation before trusting the webhook in production. The current workflow stores Twilio headers in `messages.raw_payload`, so the signature is available for future validation or audit work.

## References

- Twilio messaging webhooks: https://www.twilio.com/docs/usage/webhooks/messaging-webhooks
- Twilio WhatsApp webhook payload shape: https://www.twilio.com/docs/sms/whatsapp/api
- n8n Webhook node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- n8n Supabase credentials: https://docs.n8n.io/integrations/builtin/credentials/supabase/
