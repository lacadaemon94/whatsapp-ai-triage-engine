# AI Intent Classification

The classifier workflow turns saved inbound WhatsApp messages into structured triage labels, stores them in Supabase, and triggers the basic WhatsApp reply layer when appropriate.

## Live Workflow

```txt
Name: AI Intent Classification to Supabase
Workflow ID: <workflow-id>
Webhook: https://n8n.example.com/webhook/ai/classify-whatsapp-message
```

The active inbound workflow calls this classifier after saving the message and responding to Twilio.

## Classifier Request

```bash
curl -X POST "https://n8n.example.com/webhook/ai/classify-whatsapp-message" \
  -H "Content-Type: application/json" \
  -d '{"message_id":"MESSAGE_UUID","source":"manual_test"}'
```

## OpenAI

The workflow uses the Responses API through a plain n8n HTTP Request node, not the native OpenAI node. This avoids the n8n OpenAI credential/interceptor issue seen in n8n 2.19.x-2.20.x.

Credential:

```txt
Name: OpenAI bearer header - WhatsApp triage
Type: Header Auth
Header: Authorization
Domain scope: api.openai.com
```

Model:

```txt
gpt-4.1-mini
```

Output format:

```txt
Structured Outputs with strict JSON Schema
```

## Intents

- `sales_lead`
- `support_faq`
- `reservation_booking`
- `human_escalation`
- `spam_noise`
- `unknown`

## Supabase

RPCs:

- `get_whatsapp_classification_context(message_id, recent_limit)`
- `save_ai_classification(payload)`

Tables updated:

- `ai_classifications`
- `contacts.last_intent`
- `contacts.conversation_summary`
- `contacts.lead_score`
- `conversations.last_intent`
- `conversations.summary`
- `lead_events` for lead/booking classifications
- `handoff_requests` for human escalation classifications

After saving the classification, the workflow builds a conservative Spanish reply and calls the outbound send-and-save workflow unless the intent is `spam_noise`.

## Verification

The full inbound smoke test message:

```txt
Hola, cuanto cuesta para ir este sabado? Somos 8 personas.
```

was classified as:

```txt
intent: reservation_booking
confidence: 0.95
urgency: medium
```
