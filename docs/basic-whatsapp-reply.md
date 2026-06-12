# Basic WhatsApp Reply

The AI classification workflow now sends a conservative Spanish reply after saving the intent classification.

Live reply path:

```txt
Inbound Twilio webhook
  -> Save inbound message
  -> AI intent classification
  -> Save classification
  -> Build basic reply
  -> Twilio Send WhatsApp Reply and Save Outbound
```

## Reply Rules

- `reservation_booking`: asks for missing group size and/or preferred time, or acknowledges the reservation request.
- `sales_lead`: asks for a little more detail.
- `support_faq`: acknowledges the question and says the system will share the relevant info.
- `human_escalation`: tells the customer a human will help.
- `unknown`: asks for more detail.
- `spam_noise`: sends no reply.

The basic reply layer does not invent prices, availability, dates, or policies. It only asks for missing information or acknowledges the routing state.

## Outbound Logging

Replies are sent through:

```txt
Workflow: Twilio Send WhatsApp Reply and Save Outbound
Webhook: https://n8n.example.com/webhook/twilio/send-whatsapp-reply
```

That workflow writes the outbound message to `public.messages` with:

```txt
direction = outbound
sender_type = ai
delivery_status = Twilio status
```

## Notes

This is intentionally a basic response engine. The next production step is to replace static responses with a guarded response generator that uses company facts, availability, and pricing rules.
