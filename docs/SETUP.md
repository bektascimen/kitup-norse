# Setup Guide

## Required services + accounts

- **Node.js 20** (`.nvmrc`) and **pnpm 9** (`packageManager` field).
- **Supabase project** — provisioned via MCP. The current case-study project ref is `cqkajygmcgzoselurgvu` (region `eu-central-1`). For a fresh setup, run `supabase init` then `supabase link --project-ref <new-ref>`.
- **Gemini API key** — free tier at https://aistudio.google.com/app/apikey. Set as Edge Function secret `GEMINI_API_KEY` in Supabase Dashboard.
- **Apple Developer team ID** (optional, only for iOS widget + Apple Sign-In on device): set in `apps/mobile/app.config.ts` (`appleTeamId`) and in the Supabase Auth dashboard under Apple provider.
- **Sentry projects** (optional): mobile + admin projects, DSNs go in `.env.local` (`SENTRY_DSN_MOBILE`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN_ADMIN`).
- **PostHog** (optional, self-hosted on Coolify VPS or app.posthog.com): API key + host into `.env.local`.

## Env vars

Copy `.env.example` → `.env.local` (root) and fill in:

```
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_PROJECT_REF=<ref>
GEMINI_API_KEY=...   # only needed for the seed script and Edge Function secrets
SENTRY_DSN_MOBILE=...
SENTRY_DSN_ADMIN=...
POSTHOG_API_KEY=...
POSTHOG_HOST=https://app.posthog.com
```

For admin web, also create `apps/admin/.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL=http://localhost:3001`, optional `NEXT_PUBLIC_SENTRY_DSN`.

The Supabase `service_role` key is **intentionally absent** from every layer — see the security note in spec §3.

## Admin user setup

After signing up via magic link in the admin login page (`http://localhost:3001/login`), grant yourself the admin role:

```sql
update auth.users
set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"')
where email = 'you@example.com';
```

This makes the JWT carry `app_metadata.role = 'admin'`, which the `is_admin()` SQL helper and Edge Function admin checks rely on.

## Apple Sign-In setup

1. Create an Apple Services ID and Apple Sign-In key in your Apple Developer account.
2. In Supabase Dashboard → Authentication → Providers → Apple, paste the Services ID and Secret Key.
3. Mobile app reads these via OAuth — no client config needed beyond the `expo-apple-authentication` plugin already in `app.config.ts`.

## iOS widget

See README "iOS home-screen widget" section.
