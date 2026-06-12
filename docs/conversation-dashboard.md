# Next.js Conversation Dashboard

The dashboard lives in `apps/dashboard-nextjs` and reads the existing WhatsApp triage tables:

- `contacts`
- `conversations`
- `messages`
- `ai_classifications`
- `handoff_requests`
- `lead_events`

It is currently an internal, server-rendered dashboard. Supabase access uses the service-role key only in server-side code, so do not expose this app publicly until authentication is added.

## Run locally

From WSL:

```bash
cd <repo-root>/apps/dashboard-nextjs
source ~/.nvm/nvm.sh
npm run dev -- --hostname 0.0.0.0 --port 3001
```

The npm scripts load the repo root `.env` automatically through `scripts/next-with-root-env.mjs`, so secrets stay in the root `.env` file.

Then open:

```text
http://127.0.0.1:3001
```

## Build check

```bash
cd <repo-root>/apps/dashboard-nextjs
source ~/.nvm/nvm.sh
npm run build
```

Verified with `next@16.2.7`.

## Next critical product choice

Before this dashboard is deployed anywhere public, decide the operator access model:

- Supabase Auth with an allowlisted operator table.
- n8n/basic reverse-proxy auth for a quick internal-only deployment.
- A private network/VPN-only dashboard.
