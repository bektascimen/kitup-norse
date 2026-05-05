# kitUP — Norse Mythology Microlearning App: Design Spec

**Date:** 2026-05-04
**Status:** Approved by user, ready for implementation planning
**Case study:** kitUP Mobile Developer Case Study (10 days)
**Topic:** "21 Days of Norse Mythology"

---

## 1. Goal & Scope

Build a mobile microlearning app that teaches Norse mythology over 21 days, with a web admin dashboard for content management and AI-powered course generation. Implement **all required parts (Part 1–4)** of the case study **and both bonus features** (Web Admin + AI Content Generation).

**Evaluation criteria targeted:** product thinking, mobile development approach, code quality / architectural decisions, UX flow.

**Out of scope:**
- Production-grade scaling (single-tenant Supabase project is fine).
- Native modules outside Expo's managed/dev-client workflow except the iOS widget.
- Android home-screen widget (iOS widget only).
- Social login (Google/Facebook). Apple Sign-In iOS-only + email magic link cross-platform.
- Payments / subscriptions.

---

## 2. Why this topic

- **Differentiating:** the case study lists food/cuisine examples; almost no candidate will choose mythology. Memorability ↑.
- **Form-content match:** each Norse myth is naturally a self-contained 3–5 minute story → ideal microlearning unit.
- **Demo aesthetics:** dark theme, runic typography, dramatic art assets give the demo video a strong atmosphere.
- **AI safety:** mythology is well-documented; Gemini hallucination risk on known myths is low.
- **Pop-culture priming:** God of War Ragnarök, Marvel's Loki/Thor, the Vikings TV series — the audience already has a mental model.

---

## 3. Tech Stack (locked)

| Layer | Choice |
|---|---|
| Mobile | Expo SDK (latest) + React Native + TypeScript + Expo Router |
| Backend | Supabase: Postgres + RLS, Auth, Storage, Realtime, Edge Functions (Deno) |
| Admin web | Next.js 15 (App Router) + Tailwind + shadcn/ui |
| AI | Google Gemini API (free tier), called only from Edge Functions — never from clients |
| Security | **Service role key is never used** anywhere (clients, admin web, edge functions, scripts). Clients use `SUPABASE_PUBLISHABLE_KEY`. Edge Functions pass through the caller's JWT (RLS applies). Background/cron work uses `SECURITY DEFINER` Postgres functions + `pg_cron`. |
| State (mobile) | Zustand for local UI state, TanStack Query for server state with MMKV persist |
| Storage (mobile) | MMKV (cache + key-value), expo-secure-store (tokens) |
| i18n | Backend-driven key/value table in Supabase, MMKV-cached, Realtime invalidation |
| Auth | Supabase Auth: anonymous bootstrap → Apple Sign-In (iOS) and email magic link (any platform) |
| Observability | Sentry (mobile + web, separate projects), PostHog (self-hosted on existing Coolify VPS) |
| CI/CD | GitHub Actions: lint + typecheck + test + build on PR |
| Repo | pnpm monorepo at `~/Projects/kitup-case/` |

---

## 4. System Architecture

```
┌─────────────────┐         ┌──────────────────────────────┐
│  Mobile (Expo)  │◄───────►│         Supabase             │
│  iOS/Android    │  HTTPS  │  ┌────────────────────────┐  │
│                 │  +WSS   │  │ Postgres + RLS         │  │
│  - Dark theme   │         │  │ Auth (Anon/Email/Apple)│  │
│  - Offline-first│         │  │ Storage (lesson media) │  │
│  - iOS Widget   │         │  │ Realtime               │  │
└─────────────────┘         │  │ Edge Functions ────────┼──┼──► Gemini API
                            │  └────────────────────────┘  │
┌─────────────────┐         │                              │
│  Admin (Next.js)│◄───────►│                              │
│  shadcn/ui      │         └──────────────────────────────┘
└─────────────────┘
                            ┌──────────────────────────────┐
                            │ Sentry · PostHog · GH Actions│
                            └──────────────────────────────┘
```

Three surfaces, one backend. Supabase is the single source of truth. Gemini is invoked only from Edge Functions; the API key never reaches a client. **No layer ever holds the Supabase `service_role` key** — clients use the publishable key, Edge Functions act on the caller's JWT (RLS-enforced), and scheduled work runs as `SECURITY DEFINER` Postgres functions.

---

## 5. Repository Structure

```
kitup-case/
├── apps/
│   ├── mobile/                # Expo
│   │   ├── app/               # Expo Router
│   │   │   ├── (auth)/
│   │   │   ├── (onboarding)/
│   │   │   ├── (tabs)/        # Today / Path / Profile
│   │   │   ├── lesson/[id].tsx
│   │   │   └── quiz/[id].tsx
│   │   ├── components/
│   │   ├── features/          # vertical slices
│   │   │   ├── auth/
│   │   │   ├── lessons/
│   │   │   ├── quiz/
│   │   │   ├── progress/
│   │   │   ├── streak/
│   │   │   └── i18n/
│   │   ├── lib/               # supabase client, query client, storage
│   │   ├── theme/             # tokens, fonts (Cinzel/Inter)
│   │   ├── widgets/ios/       # Today's Lesson widget
│   │   └── app.config.ts
│   │
│   └── admin/                 # Next.js 15
│       ├── app/
│       │   ├── (auth)/login
│       │   ├── courses/
│       │   ├── lessons/
│       │   ├── quizzes/
│       │   ├── translations/
│       │   ├── app-config/
│       │   └── generate/
│       └── lib/
│
├── packages/
│   ├── shared-types/          # Supabase generated types + domain types
│   ├── shared-i18n/           # fallback dictionary + key constants
│   └── eslint-config/
│
├── supabase/
│   ├── migrations/            # timestamped SQL migrations
│   ├── functions/             # Edge Functions (Deno)
│   │   ├── generate-course/
│   │   ├── translate-content/
│   │   └── seed-defaults/
│   └── config.toml
│
├── .github/workflows/
├── docs/superpowers/
│   ├── specs/
│   └── plans/
└── pnpm-workspace.yaml
```

---

## 6. Data Model

```sql
-- Courses & content
courses (id, slug, title_key, description_key, day_count, cover_image_url,
         difficulty, status, created_at)

lessons (id, course_id, day_number, title_key, body_key, hero_image_url,
         audio_url, est_minutes, created_at)

quizzes (id, lesson_id, pass_threshold)
quiz_questions (id, quiz_id, type, stem_key, explanation_key, position)
  -- type ENUM: 'multiple_choice', 'true_false'
quiz_options (id, question_id, label_key, is_correct, position)

-- Users
profiles (id, display_name, locale, notification_time, anonymous, created_at)
  -- id = auth.users.id

user_progress (user_id, lesson_id, completed_at, score, attempts)
user_streaks (user_id, current_streak, longest_streak, last_active_date)
user_bookmarks (user_id, lesson_id, created_at)

-- Spaced repetition (simplified SM-2)
review_queue (id, user_id, question_id, due_at, interval_days, ease_factor)

-- Backend-driven i18n
translations (key TEXT, locale TEXT, value TEXT, updated_at,
              PRIMARY KEY (key, locale))

-- Remote config + feature flags
app_config (key TEXT PRIMARY KEY, value JSONB, updated_at)

-- AI generation jobs
generation_jobs (id, requested_by, type, input_payload JSONB,
                 status, output_ref, error_msg, created_at, updated_at)
  -- type ENUM: 'course', 'translation', 'quiz'
  -- status ENUM: 'pending', 'running', 'done', 'failed'
```

**RLS policies (summary):**
- Content tables (`courses`, `lessons`, `quizzes`, `quiz_questions`, `quiz_options`, `translations`, `app_config`): everyone can `SELECT`, only `admin` role can `INSERT/UPDATE/DELETE`.
- User-owned tables (`profiles`, `user_progress`, `user_streaks`, `review_queue`, `user_bookmarks`): owner-only via `auth.uid() = user_id`.
- `generation_jobs`: admin-only.

Admin role is determined by `auth.users.raw_app_meta_data->>'role' = 'admin'`, set manually for the demo admin account.

---

## 7. Mobile App — Screen Flow

```
Splash
  ↓
Onboarding (3 screens: welcome → why microlearning → language pick)
  ↓
Course Picker (one course visible: Norse Mythology 21 days)
  ↓
Tabs:
  ├── Today (today's lesson card + streak badge + review-due badge)
  ├── Path (21-day overview with progress bar)
  └── Profile (account, language, notifications, theme, sign out)

Today → Lesson Detail (hero image, markdown body, optional audio)
  → Quiz (3–5 questions, MC + T/F mixed, instant feedback + explanation)
  → Day Complete (animation, streak update, "tomorrow awaits")
```

---

## 8. Admin Dashboard

**Login:** email magic link, `admin` role required (RLS denies otherwise).

**Screens:**
- **Courses** — list, CRUD, "Generate with AI" button.
- **Lessons** — drag-and-drop reordering within course, CRUD. A "preview" panel renders the lesson body + quiz with the same Markdown renderer the mobile app uses (no device chrome / iframe simulation — keeps scope tight).
- **Quizzes** — questions per lesson, mark correct option, support both quiz types.
- **Translations** — full key list, missing keys highlighted per locale, inline edit, "Auto-translate" button.
- **App Config** — feature flags + remote config key/value editor.
- **Generate** — AI generation form (topic, level, duration), live queue status via Realtime.

---

## 9. AI Generation Pipeline

Flow:

```
[Admin submits "Roman Mythology, 30 days, beginner"]
  ↓
POST /functions/v1/generate-course (admin JWT)
  ↓
Edge Function:
  1. INSERT generation_jobs (status='pending')
  2. EdgeRuntime.waitUntil(async () => {
       a. status='running'
       b. Gemini generateContent(course-outline-prompt)
          → strict JSON: { title, description, lessons:[{day,title,body,quiz}, ...] }
       c. Validate against schema; on failure, retry once with feedback
       d. INSERT courses + lessons + quizzes + questions + options
       e. INSERT translations rows (default locale = 'tr')
       f. Trigger translate-content for 'en'
       g. status='done', output_ref=course_id
     })
  3. Return job_id immediately
  ↓
Admin UI subscribes to generation_jobs WHERE id=job_id via Realtime
```

**Prompt strategy:**
- System prompt declares JSON schema, tone (atmospheric, accurate), and constraints (only well-attested myths, no neo-pagan additions).
- One-shot example with a complete lesson + quiz JSON.
- Gemini structured-output mode with explicit response schema.
- One automatic retry on schema validation failure, passing the validator error back to the model.

**Translation pipeline:** separate `translate-content` Edge Function scans the `translations` table for keys present in source locale but missing in target locale, batches them, sends to Gemini, writes results back.

---

## 10. i18n Architecture (Backend-Driven)

**Resolution chain:**
```typescript
const t = useT();
t('lesson.day1.title')
// 1. Local in-memory dictionary (loaded at startup)
// 2. MMKV cache
// 3. Background fetch from translations table → update cache
// 4. If still missing: render key as-is + log to Sentry
```

**Bootstrap:** on app launch, fetch `translations WHERE locale = userLocale`, write to MMKV. Use `updated_at` for incremental sync (only fetch rows newer than the last sync timestamp).

**Live updates:** subscribe to Realtime channel on `translations`; when an update comes in, patch the cache and trigger a re-render of any visible strings.

**Missing-key recovery:** Sentry alerts feed the admin's "Missing keys" view. Admin can fill manually or invoke "AI fill missing keys" which calls `translate-content` with the source-locale value as input.

---

## 11. Auth Flow

```
First app launch
  ↓
Anonymous sign-in (auto)  → supabase.auth.signInAnonymously()
  → INSERT profiles (anonymous=true)
  ↓
User takes lessons; progress is saved against the anonymous user
  ↓
Profile → "Create account"
  ├── Apple Sign-In  (iOS only — Platform.OS === 'ios')
  └── Email magic link (any platform)
  ↓
Anonymous user → linked user
  → supabase.auth.linkIdentity()
  → profiles.anonymous = false; existing progress is preserved
```

Apple Sign-In uses `expo-apple-authentication` + Supabase native sign-in. "Hide my email" is supported.

---

## 12. Spaced Repetition (Simplified SM-2)

```
On quiz answer:
  - Correct first time          → do not enqueue
  - Wrong                       → INSERT review_queue (due_at = now + 1d, ease=2.5)
  - Review attempt: correct     → interval *= ease; ease += 0.1 (max 3.0)
  - Review attempt: wrong       → interval = 1d; ease = max(1.3, ease - 0.2)
```

Today screen shows "X reviews due" badge. Reviews are mixed in before the day's new lesson.

---

## 13. Streak + Push Notifications

- `user_streaks` is updated on lesson completion: `last_active_date = today`, `current_streak += 1` if yesterday was active, else reset.
- A nightly Supabase scheduled Edge Function reconciles streaks (handles users who skipped a day).
- Daily push at user-selected time (default 19:00 device-local) via Expo Notifications scheduled on the device — no server-side timezone bookkeeping needed. Notification copy is read from the `translations` table so it can be tweaked without an app release.

---

## 14. Offline-First

- TanStack Query with MMKV persist adapter.
- Opening a course prefetches all lesson bodies + quizzes.
- Quiz answers submitted offline are queued in a local outbox; sync on reconnect.
- Hero images cached on disk via `expo-image`.

---

## 15. iOS Home-Screen Widget

- Built with the `expo-apple-targets` config plugin (WidgetKit target).
- Data source: a JSON file in the shared App Group container.
- Mobile app writes today's lesson summary to the container after each progress event.
- Tapping the widget deep-links via `kitup://lesson/today`.

---

## 16. Realtime Sync (Admin → Mobile)

Mobile subscribes to Realtime channels on `lessons`, `courses`, `translations`, and `app_config`. On any change, the relevant TanStack Query keys are invalidated, so the UI updates without a manual refresh.

---

## 17. Observability & CI/CD

**GitHub Actions on PR:**
- ESLint + Prettier
- TypeScript typecheck (workspace-wide)
- Vitest unit + integration
- `expo prebuild --no-install` smoke check, `next build` smoke check

**On merge to main:**
- Sentry source-map upload (mobile + admin)
- Optional EAS preview build (manual trigger to save CI minutes)

**Sentry:** separate projects for mobile and admin, release tagging tied to git SHA.

**PostHog:** self-hosted on existing Coolify VPS. Tracked events:
- `lesson_completed`
- `quiz_answered` (with correctness + question id)
- `streak_milestone` (7, 21, 30, ...)
- `ai_course_generated`
- `translation_missing` (for the recovery loop)

**Pre-commit:** Husky + lint-staged + typecheck.

---

## 18. Testing Strategy

Pragmatic, evidence-focused — not a coverage chase.

- **Unit:** Jest for mobile + shared packages consumed by mobile (RN preset); Vitest for admin web + Edge Functions. Cover spaced repetition, i18n fallback chain, Gemini prompt builder + JSON validator.
- **Component (RNTL with Jest):** quiz flow (correct/wrong/explanation), lesson renderer.
- **Integration (Vitest):** `generate-course` Edge Function happy path against a Supabase test branch.
- **Manual smoke checklist** for the demo recording.

Target: 8–12 meaningful tests. No coverage threshold.

---

## 19. Demo Video Outline (~4 minutes)

1. **0:00–0:30** — Splash → onboarding → language pick (TR).
2. **0:30–1:30** — Take a lesson → quiz → streak update; show dark/runic aesthetic.
3. **1:30–2:00** — Profile → switch to EN; translations refresh live; upgrade account via Apple Sign-In.
4. **2:00–3:00** — Admin dashboard → "Generate Greek Mythology, 14 days" → watch queue progress live → mobile picks up the new course via Realtime.
5. **3:00–3:30** — iOS home-screen widget → tap → today's lesson opens.
6. **3:30–4:00** — Admin Translations: missing key, AI fill, mobile updates instantly.
7. **Outro** — quick Sentry + PostHog dashboard glance.

---

## 20. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Gemini free-tier rate limits during demo | Pre-generate the main 21-day course; keep AI generation demo small (5–14 day course). |
| iOS widget complexity | Allocate a dedicated 1.5-day slot; if it slips, ship without it (Tier-A, not Tier-S). |
| Realtime invalidation churn | Subscribe per-table, debounce invalidations, only invalidate affected query keys. |
| Apple Sign-In requires a paid Apple Developer account | Demo on iOS Simulator with a sandbox account; document the requirement in the README. |
| Backend-driven i18n cold start | Ship minimal fallback dictionary in `shared-i18n` so the first paint is never empty. |
| Anonymous-to-linked account migration losing progress | Use Supabase `linkIdentity()` (preserves user id); cover with an integration test. |

---

## 21. Open Questions

None at design time. Implementation plan will sequence the work and decide day-by-day prioritization.
