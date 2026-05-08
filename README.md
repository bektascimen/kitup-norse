# kitUP — 21 Days of Myth

> _Velkominn, gezgin._
> 21 günlük Norse mitolojisi mikro-öğrenme uygulaması.
> Mobil + admin paneli + Gemini-üretimli içerik. Dark theme, runik tipografi, "Skald Codex" estetiği.

[![CI](https://github.com/bektascimen/kitup-norse/actions/workflows/ci.yml/badge.svg)](https://github.com/bektascimen/kitup-norse/actions)
[![Expo SDK 52](https://img.shields.io/badge/Expo-SDK%2052-000?logo=expo)](https://docs.expo.dev/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3FCF8E?logo=supabase)](https://supabase.com/)

---

## ᛞ The forge

Üç bileşenli bir codex:

```
┌─────────────────────┐         ┌──────────────────────────┐
│  Expo · React       │         │  Supabase                │
│  Native mobile      │◄───────►│  Postgres · RLS only     │
│  + iOS widget       │  HTTPS  │  Auth (Anon / Apple)     │
└─────────────────────┘  + WSS  │  Realtime · Storage      │
                                │  Edge Fns (Deno) ────────┼──► Gemini
┌─────────────────────┐         │                          │
│  Next.js 15         │◄───────►│                          │
│  Skald Codex admin  │         └──────────────────────────┘
└─────────────────────┘                  │
                                  Sentry · PostHog
```

## ᛟ Highlights

- **Mobile (Expo SDK 52, RN 0.76)** — üç arketip yolu (Bilge / Savaşçı / Yolcu), günlük ders + quiz, AI-üretimli MP3 anlatım + cihaz TTS yedeği, Skald AI eğitmen, **Sigil rozet sistemi** (Norse-temalı achievement + kazanım modalı), iOS home-screen widget, SM-2 lite spaced repetition, streak tracking, anonymous-first auth.
- **Admin (Next.js 15)** — runik sidebar, Skald Codex dashboard. Courses / Lessons / Quizzes / Translations / App Config / AI Generate. Boolean flag'lere anlık toggle, AI generation Realtime job status ile.
- **Backend (Supabase)** — Postgres + **RLS-only**. Tüm Edge Function'lar caller JWT'siyle çalışır; `service_role` anahtarı **hiçbir katmanda yok** (bilinçli güvenlik kararı).
- **i18n** — backend-driven (`translations` tablosu) + MMKV cache + Realtime invalidation. Admin'de bir string'i değiştirince mobil ~1sn'de günceller. TR + EN tam coverage (≈1.2k key/locale).
- **AI üretimi** — Gemini 2.5 Flash Lite, Edge Function içinde, **Zod-validated**. `CourseSchema` 21 günün contiguous olduğunu zorlar — halüsinasyon production'a düşmez.
- **Gözlem** — Sentry crash reporting + PostHog event analytics.

## ᚱ Tech stack

| Katman     | Araç                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Mobile     | Expo SDK 52, React Native 0.76, expo-router, react-native-reanimated, MMKV, TanStack Query (persisted) |
| Admin      | Next.js 15 (App Router + Turbopack), Tailwind, server actions, `@supabase/ssr`                         |
| Backend    | Supabase (Postgres + RLS), Edge Functions (Deno), pg_cron, Realtime                                    |
| Content    | Gemini 2.5 Flash Lite, Zod schemas, custom prompt scaffold                                             |
| Theme      | Cinzel + Crimson Pro + Inter + JetBrains Mono, forge-gold + parchment + twilight palette               |
| iOS native | SwiftUI WidgetKit, App Group `group.com.kitup.norse`                                                   |
| Auth       | Anonymous-first, Apple Sign-In upgrade, magic link (admin)                                             |
| CI         | GitHub Actions (install · lint · typecheck · test · expo prebuild)                                     |

## ᚷ Quick start

```bash
# 1. Install
pnpm install

# 2. Env (copy .env.example → .env.local at repo root + apps/admin/.env.local)
#    SUPABASE_URL=...
#    SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
#    NEXT_PUBLIC_SUPABASE_URL=...
#    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
#    GEMINI_API_KEY=...   (Edge Function secret only)

# 3. Link Supabase + apply migrations
supabase login
supabase link --project-ref <ref>
supabase db push                                 # or via MCP

# 4. Set Edge Function secrets in Supabase Dashboard
#    GEMINI_API_KEY · SUPABASE_URL · SUPABASE_PUBLISHABLE_KEY

# 5. Seed a 21-day Norse course via the AI pipeline
SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... \
  SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... \
  pnpm -F @kitup/scripts seed:norse

# 6. Run
pnpm --filter @kitup/mobile start                # Expo dev server
pnpm --filter @kitup/admin dev                   # → http://localhost:3001
```

## ᛒ Repo layout

```
apps/
  mobile/        Expo + RN — features/ for domain modules, app/ for routes
  admin/         Next.js 15 App Router — (admin)/ for protected, login/ public
packages/
  shared-types/      Database & Locale TS types
  shared-i18n/       resolveTranslation helper
  supabase-clients/  browser + edge factories (no service_role anywhere)
  eslint-config/     base config consumed by every workspace
supabase/
  migrations/    timestamped SQL — append-only
  functions/     generate-course / translate-content / ask-skald (Deno)
scripts/
  seed-norse.ts  one-shot AI seed for a 21-day Norse course
```

## ᛗ Notable architectural decisions

1. **No service_role anywhere.** Every privileged op goes through the caller's JWT and an `is_admin()` SQL helper that reads `app_metadata.role`. No client/server bypass paths exist.
2. **Backend-driven i18n via `*_key` columns.** Content rows reference translation keys; the resolver reads from a Realtime-subscribed cache. Adding a new locale = inserting rows.
3. **Sigiller derived, not persisted.** The 6 Norse rozets are computed client-side from `useLearnerStats`. Seen-state is the only thing in MMKV; auto-prunes on DB resets so re-earning works.
4. **AI output → Zod → DB.** `supabase/functions/_shared/schema.ts` is the single source of truth for AI shape. Mismatches are caught at parse, never persisted.
5. **Widget reads via App Group.** Mobile writes `today.json` to `UserDefaults(suiteName: "group.com.kitup.norse")`; SwiftUI widget reads it. JS-side `WidgetCenter.reloadAllTimelines()` triggers immediate refresh.

## ᚺ Testing

```bash
pnpm typecheck                       # all workspaces
pnpm test                            # vitest (admin / packages) + jest-expo (mobile)
pnpm lint                            # ESLint v8 across the monorepo

pnpm --filter @kitup/mobile exec jest features/badges       # one feature
cd supabase/functions && deno test _shared/__tests__         # AI prompt + schema
```

CI runs install · lint · typecheck · test · `expo prebuild --no-install` on every push & PR.

## ᛏ License

Case-study material — kitUP applicant submission, May 2026. Bektaş Çimen.
