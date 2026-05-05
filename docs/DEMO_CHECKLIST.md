# Demo Recording Checklist (~4 minutes)

Smoke-test before recording. Order matches the demo video outline.

## Pre-flight

- [ ] Cloud Supabase project healthy (`mcp__supabase__get_project` → ACTIVE_HEALTHY)
- [ ] Migrations 1-7 applied (initial schema, RLS, draft visibility, translations helper, link identity, streak reconciler, review queue unique)
- [ ] Seed translations row count ≥ 62 (`select count(*) from translations`)
- [ ] At least one course published (`select count(*) from courses where status='published'`); if 0, run `pnpm -F @kitup/scripts seed:norse`
- [ ] Edge functions deployed and active: `generate-course`, `translate-content`
- [ ] Edge Function secrets set: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- [ ] Admin user has `app_metadata.role = 'admin'`
- [ ] Apple Sign-In provider configured (if recording the upgrade flow)

## Mobile (~2:30)

- [ ] iOS Simulator running (iPhone 15 Pro recommended, dark mode)
- [ ] App reset (delete + reinstall) — go through onboarding fresh
- [ ] Welcome → Why → Language: pick TR
- [ ] Today screen: see Day 1 lesson card
- [ ] Open lesson → markdown body renders → Continue to quiz
- [ ] Quiz: answer 3 questions (intentionally wrong on one to trigger SR queue)
- [ ] Day complete: see score + fade-in
- [ ] Back to Today → "Reviews due" badge appears
- [ ] Profile → switch to EN → strings update live
- [ ] Profile → email magic link form (don't actually send during demo)
- [ ] Profile → Apple Sign-In button visible

## Admin web (~1:00)

- [ ] http://localhost:3001 → redirects to /login
- [ ] Magic link login → land on /
- [ ] Nav: Courses / Lessons / Quizzes / Translations / App Config / Generate
- [ ] Generate page: enter "Greek Mythology" / beginner / 5 days / EN
- [ ] Watch JobStatus flip pending → running → done
- [ ] Mobile: switch to course picker (Phase 14 polish; or watch Today refresh via Realtime)
- [ ] Translations page: edit a TR string → mobile updates within ~1s

## iOS widget (~0:30)

- [ ] Add "Today's Norse Lesson" widget to home screen
- [ ] Verify it shows Day N + title from the App Group container
- [ ] Tap widget → opens app at /lesson/today

## Outro

- [ ] Sentry dashboard: zoomed view showing 0 errors (or fresh test error)
- [ ] PostHog dashboard: lesson_completed event count

## Recording tips

- Record in 1080p portrait for mobile clips, 1440p landscape for admin clips.
- Cut between mobile + admin to keep pacing tight.
- Voiceover in TR (target audience kitUP). EN-language frame appears when switching locale on Profile screen.
- Open with the runic kitUP logo + dark theme; close with the Sentry/PostHog dashboards.
