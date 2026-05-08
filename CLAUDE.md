# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

pnpm workspace (`pnpm-workspace.yaml`) with three workspace roots:

- `apps/mobile` — Expo / React Native 0.76 (`@kitup/mobile`). Expo Router under `app/`, feature modules under `features/`, theme tokens under `theme/`.
- `apps/admin` — Next.js 15 App Router on port **3001** (`@kitup/admin`). Routes under `src/app/(admin)/`. Uses Turbo dev (`next dev --turbo`), Vitest for tests.
- `scripts/` — `@kitup/scripts`, currently just `seed:norse` (tsx).
- `packages/{shared-types,shared-i18n,supabase-clients,eslint-config}` — internal libs consumed via `workspace:*`.
- `supabase/` — `migrations/`, `functions/` (Deno Edge Functions), `seed.sql`, `config.toml`. Not a workspace package.

Node ≥20 (`.nvmrc`), pnpm 9.15.0 (`packageManager`).

## Common commands

Run from repo root unless noted. All root scripts are `pnpm -r` fan-outs, so they work for every workspace.

```bash
pnpm install                    # install everything
pnpm lint                       # eslint across all workspaces (max-warnings 0)
pnpm typecheck                  # tsc --noEmit across all workspaces
pnpm test                       # vitest (admin, shared-i18n) + jest-expo (mobile)
pnpm build                      # next build for admin (others are no-ops)

# Run a single workspace's command:
pnpm --filter @kitup/mobile start          # Expo dev server
pnpm --filter @kitup/mobile ios            # native iOS run
pnpm --filter @kitup/admin dev             # admin → http://localhost:3001
pnpm --filter @kitup/admin test            # vitest run
pnpm -F @kitup/scripts seed:norse          # seed a 21-day Norse course via Gemini

# Single test:
pnpm --filter @kitup/admin exec vitest run path/to/file.test.ts
pnpm --filter @kitup/mobile exec jest -t "test name"
```

Edge Functions live in `supabase/functions/<name>/` with their own `deno.json`. The shared schema/prompts under `_shared/` have Deno tests:

```bash
cd supabase/functions && deno test _shared/__tests__
```

Pre-commit hook (`.husky/pre-commit`) runs `lint-staged` (prettier) **and** `pnpm typecheck` — slow but enforced. CI (`.github/workflows/ci.yml`) additionally runs `expo prebuild --no-install --platform android` to catch Expo config breakage.

## Architecture you can't see from one file

### Supabase is the entire backend, RLS-only

There is **no `service_role` key anywhere** in this repo by design (see `.env.example` and spec §3). Every privileged operation goes through:

1. The caller's JWT (anon, magic-link, or Apple).
2. RLS policies in `supabase/migrations/2026050400000{1,2}*.sql`.
3. The `is_admin()` SQL helper, which checks `app_metadata.role = 'admin'` on the JWT.

Edge Functions (`generate-course`, `translate-content`, `ask-skald`) all build a per-request Supabase client using the caller's `Authorization` header — see `packages/supabase-clients/src/edge.ts` (`createCallerClient`) and the inline equivalent in `supabase/functions/generate-course/index.ts`. **Never** introduce a service-role-keyed client; if you need elevated work, do it in a SQL function with `security definer` and gate it on `is_admin()`.

The Supabase publishable key (legacy "anon" key) is the only key shipped to clients. Mobile uses `createBrowserClient` with an MMKV-backed storage adapter (`apps/mobile/lib/supabase.ts`). Admin uses `@supabase/ssr` with cookie storage; auth-gating happens in `apps/admin/src/middleware.ts` (redirects unauthenticated users to `/login` and non-admin users to `/login?error=not_admin`).

### Backend-driven i18n via translation keys

Content tables don't store user-facing strings. They store `*_key` columns (e.g. `lessons.title_key`, `lessons.body_key`) that resolve against the `translations(key, locale, value)` table. This is why:

- AI generation writes one row per locale per key in `translations` rather than denormalizing into content rows.
- The mobile app has a `features/i18n/` module that pulls the dictionary, caches it in MMKV, and listens for Realtime changes so admin edits propagate live.
- Adding a new piece of copy means adding both a `*_key` column reference and `translations` rows for TR + EN.

### Mobile feature layout

`apps/mobile/features/` has one folder per concern (`lessons`, `quiz`, `sr`, `streak`, `notifications`, `realtime`, `widget`, `onboarding`, `auth`, `i18n`, `share`, `skald`, `resume`, `stats`). The `app/` directory is **only** Expo Router screens — they import from `features/`. Don't put domain logic under `app/`.

Spaced repetition is a custom SM-2 lite implemented in `features/sr/sm2.ts` (ease 1.3–3.0, interval doubles by ease on correct, resets to 1 day on wrong). The review queue lives in the `review_queue` table; `features/sr/queue.ts` is the source of truth for enqueue/advance logic.

### Admin app: server actions + Realtime job status

The Generate flow (`apps/admin/src/app/(admin)/generate/`) inserts a `jobs` row, invokes the Edge Function, then `JobStatus.tsx` subscribes to Realtime updates on that row to flip `pending → running → done`. Other admin CRUD pages follow the same shape: server component fetches → client component for edits → Supabase mutation from the browser client (RLS enforces admin role).

### Edge Function output is Zod-validated

`supabase/functions/_shared/schema.ts` has the canonical `CourseSchema` (lessons must be a contiguous `1..N` day sequence). Any change to the AI output shape needs a matching schema update _and_ a migration if the persisted shape changes. The Deno tests in `_shared/__tests__/` exercise the prompt + schema contract.

### iOS widget is scaffolded but inert

`apps/mobile/widgets/ios/TodayWidget` exists but the `@bacons/apple-targets` plugin is **commented out** in `app.config.ts` until a real `appleTeamId` is wired (see comment block lines 47–62). The `syncTodayWidget` helper currently only logs — wiring the App Group bridge (`group.com.kitup.norse`, key `today.json`) is a known TODO before the widget actually works on device.

### Sentry source-map upload is intentionally disabled

The `@sentry/react-native` Expo plugin is removed (see comment in `app.config.ts`) because it injects a build phase that requires `SENTRY_AUTH_TOKEN/ORG/PROJECT`. Personal-team device builds don't have those. **Runtime crash reporting still works** via `initSentry()` + DSN; only build-time symbolication upload is skipped. Don't re-enable the plugin without first provisioning those secrets in EAS.

## Conventions worth knowing

- All cross-package imports go through workspace packages (`@kitup/shared-types`, `@kitup/shared-i18n`, `@kitup/supabase-clients`). Don't reach into another app's source.
- The `Database` type in `packages/shared-types/src/database.ts` is the supabase-generated type; regenerate it after any migration.
- Migrations are append-only and timestamped (`YYYYMMDDHHMMSS_name.sql`). The Edge Function runtime can't import workspace types, so `generate-course/index.ts` deliberately uses an untyped client — that's a known compromise, not a bug.
- Admin role is bootstrapped manually with raw SQL after first magic-link signup — see `docs/SETUP.md`. There is no UI for promoting users.
- The case-study Supabase project ref is `cqkajygmcgzoselurgvu` (eu-central-1); changes go to that remote when applied via MCP / CLI.
