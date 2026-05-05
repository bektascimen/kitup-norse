# kitUP — Norse Mythology Microlearning

[![CI](https://github.com/kitup/case/actions/workflows/ci.yml/badge.svg)](https://github.com/kitup/case/actions)

A 21-day mobile microlearning app teaching Norse mythology, with a Next.js admin dashboard for content management and a Gemini-powered AI content-generation pipeline. Built as a case study for kitUP.

## Highlights

- **Mobile (Expo + RN)** — dark Norse theme, Cinzel + Inter fonts, anonymous-first auth, offline-first reads, spaced repetition (SM-2 lite), daily push reminders.
- **Admin (Next.js 15)** — courses / lessons / quizzes / translations / app-config CRUD, AI generate UI with Realtime job status.
- **AI** — Gemini-powered course generation + auto-translation. All Edge Functions strictly use the caller's JWT (never `service_role`).
- **i18n** — backend-driven dictionary (`translations` table), local MMKV cache + Realtime invalidation. TR + EN.
- **Security** — RLS-only enforcement, no `service_role` key anywhere, Sentry crash reporting, PostHog analytics.

## Architecture

See `docs/superpowers/specs/2026-05-04-kitup-norse-microlearning-design.md` for the full design and `docs/superpowers/plans/2026-05-04-kitup-norse-microlearning.md` for the bite-sized implementation plan.

```
┌─────────────┐         ┌──────────────────────┐
│ Expo mobile │◄───────►│ Supabase             │
│ + iOS widget│  HTTPS  │ Postgres + RLS       │
└─────────────┘  + WSS  │ Auth (Anon/Apple/Mag)│
                        │ Realtime · Storage   │
┌─────────────┐         │ Edge Fns (Deno)──────┼──► Gemini
│ Next.js     │◄───────►│                      │
│ admin web   │         └──────────────────────┘
└─────────────┘                  │
                          Sentry · PostHog · GH Actions
```

## Quick start

```bash
pnpm install

# 1. Set up your env (copy .env.example → .env.local in repo root + apps/admin/)
# 2. Sign in to Supabase CLI: supabase login
# 3. Link the project: supabase link --project-ref <ref>
# 4. Apply migrations + seed: supabase db push (or via MCP)
# 5. Set Edge Function secrets in Supabase Dashboard:
#    - GEMINI_API_KEY (https://aistudio.google.com/app/apikey)
#    - SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY

# Run mobile (requires Xcode for first iOS run; sim works for everything else):
pnpm --filter @kitup/mobile start

# Run admin web:
pnpm --filter @kitup/admin dev   # → http://localhost:3001

# Seed a 21-day Norse course via the AI pipeline:
SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... \
  SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... \
  pnpm -F @kitup/scripts seed:norse
```

See [docs/SETUP.md](docs/SETUP.md) for full setup including Apple Sign-In + Sentry + PostHog.

### iOS home-screen widget

The `TodayWidget` Swift target is scaffolded under `apps/mobile/widgets/ios/`. To build:

1. Set `appleTeamId` in `apps/mobile/app.config.ts` to your Apple Developer team ID.
2. Run `pnpm --filter @kitup/mobile expo prebuild --platform ios --clean`.
3. Run `pnpm --filter @kitup/mobile ios` (or open `ios/kitup-norse.xcworkspace` in Xcode).
4. The widget reads JSON from App Group `group.com.kitup.norse`, key `today.json`. The
   `syncTodayWidget` helper currently logs only — wire a native bridge (e.g.
   `react-native-shared-group-preferences`) before the demo.

## License

Case study material — kitUP applicant submission, May 2026.
