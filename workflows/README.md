# n8n workflows

These are exported workflows from the live triage stack, sanitized for public
distribution: credential IDs zeroed, internal workflow IDs stripped, hostnames
replaced with placeholders.

## Files

| File | Purpose |
| --- | --- |
| `n8n-twilio-incoming-webhook.json` | Receives Twilio's inbound WhatsApp form-encoded webhook, normalizes it, calls Supabase RPC `ingest_twilio_whatsapp_message`, returns empty TwiML, then triggers the AI classifier. |
| `n8n-ai-intent-classification.json` | OpenAI Structured Outputs call. Classifies the saved inbound message via Supabase RPCs `get_whatsapp_classification_context` + `save_ai_classification`, then triggers the outbound reply unless the intent is spam. |
| `n8n-twilio-send-and-save-outbound.json` | Sends a WhatsApp message via Twilio and logs it to `public.messages` via Supabase RPC `log_twilio_whatsapp_outbound_message`. Accepts `sender_type` so AI-generated and operator-typed replies are tagged distinctly. |
| `n8n-twilio-message-status-webhook.json` | Twilio delivery-status callback handler — updates `messages.delivery_status` via RPC `update_twilio_message_status`. |

## Importing

1. In your n8n instance, **Workflows → Import from File** and pick the JSON.
2. Each workflow will land **inactive** and with **credentials unconfigured**.
   Create the three credentials below (names are referenced inside the
   workflows so you can rename them, but the type must match):

   | Credential name (any) | Type | Purpose |
   | --- | --- | --- |
   | `Supabase service role headers` | HTTP Custom Auth | Headers: `{"apikey": "<SERVICE_ROLE_KEY>", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}` |
   | `Twilio API basic auth` | HTTP Basic Auth | username = Account SID, password = Auth Token |
   | `OpenAI bearer header` | HTTP Header Auth | Header `Authorization` = `Bearer <OPENAI_API_KEY>`, scoped to `api.openai.com` |

3. Bind the credentials in each node that's flagged red.
4. Activate the workflows and copy the production webhook URLs out — these are
   what you put in your dashboard's `.env` (`N8N_WEBHOOK_URL`,
   `N8N_OUTBOUND_WEBHOOK_URL`, `N8N_STATUS_WEBHOOK_URL`).
5. In the Twilio Console, point your WhatsApp sender's inbound webhook at the
   `n8n-twilio-incoming-webhook` URL.

## Why HTTP Custom Auth instead of native Supabase nodes?

The live n8n instance these workflows came from blocked `$env` access inside
node parameters, and the native Supabase node requires it. Using a Custom Auth
credential + plain `HTTP Request` node sidesteps that and keeps the workflow
portable across n8n versions.

## Why plain HTTP for OpenAI?

The same portability reason — plus n8n's native OpenAI node had a credential
interceptor bug in n8n 2.19.x–2.20.x. The HTTP Request approach has been
stable across every n8n version we've tried.
