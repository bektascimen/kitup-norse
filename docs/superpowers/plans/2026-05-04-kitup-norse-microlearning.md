# kitUP Norse Mythology — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile microlearning app (Norse Mythology, 21 days) with admin web dashboard and Gemini-powered content generation, satisfying every required and bonus item in the kitUP case study.

**Architecture:** pnpm monorepo with three deployables — Expo mobile app, Next.js admin web, and a Supabase project (Postgres + RLS + Auth + Realtime + Edge Functions). Gemini is invoked only from Edge Functions. Content (lessons, quizzes, UI strings) lives in Supabase and streams to clients via Realtime.

**Tech Stack:** Expo SDK + React Native + Expo Router · Next.js 15 (App Router) + Tailwind + shadcn/ui · Supabase (Postgres / RLS / Auth / Storage / Realtime / Edge Functions in Deno) · TanStack Query + Zustand + MMKV · Google Gemini (free tier) · Sentry + PostHog · GitHub Actions · Jest (mobile) + Vitest (web/edge).

**Reference:** see `docs/superpowers/specs/2026-05-04-kitup-norse-microlearning-design.md` for the full design.

---

## Phase Map

1. Foundation — monorepo, lint, Supabase init, schema migrations, generated types, CI skeleton.
2. Shared packages — `shared-types`, `shared-i18n`, `eslint-config`.
3. Mobile skeleton — Expo app boots, theme + fonts, Supabase client, anonymous auth bootstrap.
4. Admin skeleton — Next.js app boots, Supabase client, admin role guard.
5. Backend-driven i18n — `translations` table, `useT` hook, fallback chain, Realtime sync, language switch.
6. Mobile content reading — onboarding, course picker, Today / Path / Profile tabs, lesson detail, quiz flow, progress + day-complete screen.
7. Admin CRUD — courses, lessons (drag-drop reorder), quizzes, translations editor, app config editor.
8. AI generation pipeline — `generation_jobs` table, `generate-course` and `translate-content` Edge Functions, admin Generate UI with Realtime status.
9. Auth upgrade — Apple Sign-In (iOS), email magic link, anonymous→linked identity flow.
10. Engagement — streak tracking + nightly reconciler, Expo Notifications daily reminder, spaced repetition algorithm + review queue UI.
11. Offline + Realtime — TanStack Query MMKV persist, lesson prefetch, offline outbox queue, Realtime subscriptions on `lessons`/`courses`/`translations`/`app_config`.
12. iOS home-screen widget — `expo-apple-targets` config, App Group container JSON, deep-link handler.
13. Observability + CI hardening — Sentry (mobile + admin), PostHog events, GitHub Actions full pipeline, Husky pre-commit.
14. Demo prep — seed 21-day Norse content via the AI pipeline, visual polish pass, manual smoke checklist, README with screenshots and setup steps.

Each phase ends with a green typecheck + green tests + commit.

---

## Conventions

- **TDD scope:** strict for pure business logic (spaced repetition, i18n fallback, prompt builder, JSON schema validator, streak update, outbox sync); component interaction tests for quiz and lesson; integration test for `generate-course` happy path. Boilerplate scaffolding does not require a failing test first.
- **Commit cadence:** every task ends with a commit. Commit messages use conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- **File paths in this plan are relative to the repo root** `/Users/seraycatikkascimen/Projects/kitup-case`.
- **Run commands from the repo root** unless noted.
- **Do not commit secrets.** Use `.env.local` (gitignored) for Supabase service keys, Gemini key, etc.
- **Type generation:** after every migration, regenerate types via Supabase MCP into `packages/shared-types/src/database.ts`. Never edit by hand.

---

## Phase 1 — Foundation

### Task 1.1: Initialize pnpm monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.nvmrc`
- Create: `README.md`

- [ ] **Step 1: Confirm pnpm is installed**

Run: `pnpm --version`
Expected: prints a version (≥ 9.0). If missing: `corepack enable && corepack prepare pnpm@latest --activate`.

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "kitup-case",
  "version": "0.0.0",
  "private": true,
  "engines": { "node": ">=20" },
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "lint": "pnpm -r run lint",
    "typecheck": "pnpm -r run typecheck",
    "test": "pnpm -r run test",
    "build": "pnpm -r run build"
  },
  "devDependencies": {
    "prettier": "^3.3.3",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 3: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Write `.gitignore`**

```gitignore
node_modules
.DS_Store
.env
.env.local
.env.*.local
.expo
.next
dist
build
ios/Pods
android/.gradle
.turbo
*.log
coverage
.vscode/settings.json
supabase/.branches
supabase/.temp
```

- [ ] **Step 5: Write `.editorconfig`**

```ini
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

- [ ] **Step 6: Write `.nvmrc`**

```
20
```

- [ ] **Step 7: Write minimal `README.md`**

```markdown
# kitUP — Norse Mythology Microlearning

Mobile microlearning app + admin web + Gemini-powered content generation.
Case study for kitUP. See `docs/superpowers/specs/` for design and `docs/superpowers/plans/` for implementation plan.

## Quick start

```bash
pnpm install
pnpm dev # starts mobile + admin in parallel
```

Setup details to be expanded in Phase 14.
```

- [ ] **Step 8: Install root dependencies**

Run: `pnpm install`
Expected: lockfile created, no errors.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore .editorconfig .nvmrc README.md
git commit -m "chore: initialize pnpm monorepo skeleton"
```

---

### Task 1.2: Shared ESLint + Prettier config package

**Files:**
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/index.js`
- Create: `packages/eslint-config/react-native.js`
- Create: `packages/eslint-config/next.js`
- Create: `prettier.config.cjs`

- [ ] **Step 1: Write `packages/eslint-config/package.json`**

```json
{
  "name": "@kitup/eslint-config",
  "version": "0.0.0",
  "private": true,
  "main": "index.js",
  "exports": {
    ".": "./index.js",
    "./react-native": "./react-native.js",
    "./next": "./next.js"
  },
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^8.10.0",
    "@typescript-eslint/parser": "^8.10.0",
    "eslint": "^9.13.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.0.0"
  }
}
```

- [ ] **Step 2: Write `packages/eslint-config/index.js`**

```js
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  settings: { react: { version: "detect" } },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
};
```

- [ ] **Step 3: Write `packages/eslint-config/react-native.js`**

```js
module.exports = {
  extends: [require.resolve("./index.js")],
  env: { "react-native/react-native": true },
  globals: { __DEV__: "readonly" }
};
```

- [ ] **Step 4: Write `packages/eslint-config/next.js`**

```js
module.exports = {
  extends: [require.resolve("./index.js"), "next/core-web-vitals"]
};
```

- [ ] **Step 5: Write `prettier.config.cjs`**

```js
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2
};
```

- [ ] **Step 6: Install + verify**

Run: `pnpm install`
Expected: `@kitup/eslint-config` linked across the workspace.

- [ ] **Step 7: Commit**

```bash
git add packages/eslint-config prettier.config.cjs package.json pnpm-lock.yaml
git commit -m "chore: shared eslint + prettier config"
```

---

### Task 1.3: Initialize Supabase project

**Files:**
- Create: `supabase/config.toml`
- Create: `.env.example`
- Modify: `.gitignore` (already contains `supabase/.branches` etc.)

- [ ] **Step 1: Confirm Supabase CLI installed**

Run: `supabase --version`
Expected: version printed. If missing: `brew install supabase/tap/supabase`.

- [ ] **Step 2: Initialize Supabase**

Run: `supabase init`
Expected: creates `supabase/config.toml` and `supabase/seed.sql`.

- [ ] **Step 3: Edit `supabase/config.toml`** — set `project_id = "kitup-norse"`, ensure `[auth]` section has:

```toml
[auth]
enable_signup = true
enable_anonymous_sign_ins = true
[auth.email]
enable_signup = true
enable_confirmations = false
[auth.external.apple]
enabled = true
client_id = "env(APPLE_SERVICES_ID)"
secret = "env(APPLE_SECRET_KEY)"
```

- [ ] **Step 4: Write `.env.example`**

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=

# Gemini
GEMINI_API_KEY=

# Apple Sign-In (Edge config)
APPLE_SERVICES_ID=
APPLE_SECRET_KEY=

# Sentry
SENTRY_DSN_MOBILE=
SENTRY_DSN_ADMIN=

# PostHog
POSTHOG_API_KEY=
POSTHOG_HOST=
```

- [ ] **Step 5: Use Supabase MCP to create the cloud project (if not yet created)**

Use `mcp__supabase__create_project` with name `kitup-norse-microlearning`, region `eu-central-1`. Capture project ref into `.env.local` (not `.env.example`).

- [ ] **Step 6: Commit**

```bash
git add supabase/config.toml supabase/seed.sql .env.example
git commit -m "chore: initialize supabase project + env template"
```

---

### Task 1.4: Initial schema migration

**Files:**
- Create: `supabase/migrations/20260504000001_initial_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ENUMs
create type quiz_question_type as enum ('multiple_choice', 'true_false');
create type job_type as enum ('course', 'translation', 'quiz');
create type job_status as enum ('pending', 'running', 'done', 'failed');
create type course_status as enum ('draft', 'published', 'archived');
create type difficulty as enum ('beginner', 'intermediate', 'advanced');

-- Content
create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_key text not null,
  description_key text not null,
  day_count int not null check (day_count > 0),
  cover_image_url text,
  difficulty difficulty not null default 'beginner',
  status course_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  day_number int not null check (day_number > 0),
  title_key text not null,
  body_key text not null,
  hero_image_url text,
  audio_url text,
  est_minutes int not null default 5,
  created_at timestamptz not null default now(),
  unique (course_id, day_number)
);
create index lessons_course_idx on lessons(course_id);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references lessons(id) on delete cascade,
  pass_threshold int not null default 60
);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  type quiz_question_type not null,
  stem_key text not null,
  explanation_key text,
  position int not null,
  unique (quiz_id, position)
);
create index quiz_questions_quiz_idx on quiz_questions(quiz_id);

create table quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  label_key text not null,
  is_correct boolean not null default false,
  position int not null,
  unique (question_id, position)
);
create index quiz_options_question_idx on quiz_options(question_id);

-- Users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'tr',
  notification_time time not null default '19:00:00',
  anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

create table user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  completed_at timestamptz,
  score int,
  attempts int not null default 0,
  primary key (user_id, lesson_id)
);
create index user_progress_user_idx on user_progress(user_id);

create table user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date
);

create table user_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  due_at timestamptz not null,
  interval_days int not null default 1,
  ease_factor real not null default 2.5
);
create index review_queue_user_due_idx on review_queue(user_id, due_at);

-- i18n (backend-driven)
create table translations (
  key text not null,
  locale text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (key, locale)
);
create index translations_locale_idx on translations(locale);

-- Remote config / feature flags
create table app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- AI generation jobs
create table generation_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete set null,
  type job_type not null,
  input_payload jsonb not null,
  status job_status not null default 'pending',
  output_ref uuid,
  error_msg text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index generation_jobs_status_idx on generation_jobs(status, created_at);
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `mcp__supabase__apply_migration` with name `initial_schema` and the SQL above.
Expected: success.

- [ ] **Step 3: Verify tables**

Use `mcp__supabase__list_tables` filtered to schema `public`.
Expected: all 12 tables present.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): initial schema (content, users, i18n, jobs)"
```

---

### Task 1.5: RLS policies migration

**Files:**
- Create: `supabase/migrations/20260504000002_rls_policies.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Enable RLS
alter table courses enable row level security;
alter table lessons enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table translations enable row level security;
alter table app_config enable row level security;
alter table profiles enable row level security;
alter table user_progress enable row level security;
alter table user_streaks enable row level security;
alter table user_bookmarks enable row level security;
alter table review_queue enable row level security;
alter table generation_jobs enable row level security;

-- Helper: admin check
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Public-read content
create policy "content readable by all" on courses
  for select using (status = 'published' or public.is_admin());
create policy "lessons readable by all" on lessons
  for select using (true);
create policy "quizzes readable by all" on quizzes for select using (true);
create policy "quiz_questions readable by all" on quiz_questions for select using (true);
create policy "quiz_options readable by all" on quiz_options for select using (true);
create policy "translations readable by all" on translations for select using (true);
create policy "app_config readable by all" on app_config for select using (true);

-- Admin-only writes for content
create policy "admin writes courses" on courses
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin writes lessons" on lessons
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin writes quizzes" on quizzes
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin writes quiz_questions" on quiz_questions
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin writes quiz_options" on quiz_options
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin writes translations" on translations
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin writes app_config" on app_config
  for all using (public.is_admin()) with check (public.is_admin());

-- User-owned tables
create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own progress" on user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own streaks" on user_streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own bookmarks" on user_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own review queue" on review_queue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admin-only generation jobs
create policy "admin generation jobs" on generation_jobs
  for all using (public.is_admin()) with check (public.is_admin());

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, anonymous)
  values (new.id, coalesce(new.is_anonymous, false))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: bump updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_translations_updated before update on translations
  for each row execute function public.set_updated_at();
create trigger trg_app_config_updated before update on app_config
  for each row execute function public.set_updated_at();
create trigger trg_generation_jobs_updated before update on generation_jobs
  for each row execute function public.set_updated_at();

-- Realtime publication
alter publication supabase_realtime add table courses, lessons, quizzes,
  quiz_questions, quiz_options, translations, app_config, generation_jobs;
```

- [ ] **Step 2: Apply migration via MCP**

Use `mcp__supabase__apply_migration` with name `rls_policies`.

- [ ] **Step 3: Verify with security advisor**

Use `mcp__supabase__get_advisors` with `type: "security"`. Fix any flagged issues (e.g., function search_path).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): RLS policies, profile trigger, realtime publication"
```

---

### Task 1.6: Generate database types

**Files:**
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/src/database.ts` (generated)

- [ ] **Step 1: Write `packages/shared-types/package.json`**

```json
{
  "name": "@kitup/shared-types",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "gen": "echo 'Run via Supabase MCP generate_typescript_types'"
  },
  "devDependencies": {
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: Write `packages/shared-types/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Generate database.ts via MCP**

Use `mcp__supabase__generate_typescript_types`. Save the output to `packages/shared-types/src/database.ts`.

- [ ] **Step 4: Write `packages/shared-types/src/index.ts`**

```ts
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './database';

export type Locale = 'tr' | 'en';
export const SUPPORTED_LOCALES: readonly Locale[] = ['tr', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'tr';
```

- [ ] **Step 5: Install + typecheck**

Run: `pnpm install && pnpm --filter @kitup/shared-types typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/shared-types
git commit -m "feat(types): generated supabase database types + shared enums"
```

---

### Task 1.7: GitHub Actions skeleton

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile

  lint:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "chore(ci): add lint/typecheck/test workflow skeleton"
```

---

## Phase 2 — Shared packages

### Task 2.1: `shared-i18n` package (constants + fallback dictionary)

**Files:**
- Create: `packages/shared-i18n/package.json`
- Create: `packages/shared-i18n/tsconfig.json`
- Create: `packages/shared-i18n/src/index.ts`
- Create: `packages/shared-i18n/src/fallback.ts`
- Create: `packages/shared-i18n/src/keys.ts`
- Create: `packages/shared-i18n/src/__tests__/fallback.test.ts`

- [ ] **Step 1: Write `packages/shared-i18n/package.json`**

```json
{
  "name": "@kitup/shared-i18n",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint src --max-warnings 0"
  },
  "dependencies": {
    "@kitup/shared-types": "workspace:*"
  },
  "devDependencies": {
    "@kitup/eslint-config": "workspace:*",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Write `packages/shared-i18n/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write keys file**

`packages/shared-i18n/src/keys.ts`:

```ts
export const I18N_KEYS = {
  app: {
    name: 'app.name',
    tagline: 'app.tagline',
  },
  onboarding: {
    welcome_title: 'onboarding.welcome.title',
    welcome_body: 'onboarding.welcome.body',
    cta_continue: 'onboarding.cta.continue',
    language_pick_title: 'onboarding.language.title',
  },
  tabs: {
    today: 'tabs.today',
    path: 'tabs.path',
    profile: 'tabs.profile',
  },
  today: {
    streak_days_one: 'today.streak.days_one',
    streak_days_other: 'today.streak.days_other',
    reviews_due: 'today.reviews_due',
    cta_start: 'today.cta.start',
  },
  lesson: {
    cta_continue_quiz: 'lesson.cta.continue_quiz',
    audio_play: 'lesson.audio.play',
  },
  quiz: {
    correct: 'quiz.correct',
    incorrect: 'quiz.incorrect',
    explanation_title: 'quiz.explanation.title',
    submit: 'quiz.submit',
    next_question: 'quiz.next',
    finish: 'quiz.finish',
  },
  day_complete: {
    title: 'day.complete.title',
    body: 'day.complete.body',
  },
  profile: {
    create_account: 'profile.create_account',
    sign_in_apple: 'profile.signin.apple',
    sign_in_email: 'profile.signin.email',
    language: 'profile.language',
    notification_time: 'profile.notification_time',
    sign_out: 'profile.sign_out',
  },
  notifications: {
    daily_title: 'notifications.daily.title',
    daily_body: 'notifications.daily.body',
  },
} as const;

type Leaf = string;
type DeepLeaves<T> = T extends Leaf ? T : T extends object ? DeepLeaves<T[keyof T]> : never;
export type I18nKey = DeepLeaves<typeof I18N_KEYS>;
```

- [ ] **Step 4: Write the failing test for fallback resolver**

`packages/shared-i18n/src/__tests__/fallback.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveTranslation } from '../fallback';

const dict = {
  tr: { 'tabs.today': 'Bugün', 'tabs.path': 'Yol' },
  en: { 'tabs.today': 'Today' },
};

describe('resolveTranslation', () => {
  it('returns the value for the requested locale', () => {
    expect(resolveTranslation('tabs.today', 'tr', dict)).toEqual({
      value: 'Bugün',
      source: 'requested',
    });
  });

  it('falls back to the default locale (tr) if requested locale missing', () => {
    expect(resolveTranslation('tabs.path', 'en', dict)).toEqual({
      value: 'Yol',
      source: 'fallback',
    });
  });

  it('returns the key itself with source=missing if both locales lack it', () => {
    expect(resolveTranslation('tabs.unknown', 'en', dict)).toEqual({
      value: 'tabs.unknown',
      source: 'missing',
    });
  });

  it('returns missing if dict has no fallback locale entry', () => {
    expect(resolveTranslation('foo', 'en', { en: {} })).toEqual({
      value: 'foo',
      source: 'missing',
    });
  });
});
```

- [ ] **Step 5: Run the test to confirm it fails**

Run: `pnpm --filter @kitup/shared-i18n test`
Expected: FAIL — module `../fallback` not found.

- [ ] **Step 6: Implement `packages/shared-i18n/src/fallback.ts`**

```ts
import { DEFAULT_LOCALE, type Locale } from '@kitup/shared-types';

export type Dictionary = Partial<Record<Locale, Record<string, string>>>;

export type Resolution = {
  value: string;
  source: 'requested' | 'fallback' | 'missing';
};

export function resolveTranslation(
  key: string,
  locale: Locale,
  dict: Dictionary,
): Resolution {
  const requested = dict[locale]?.[key];
  if (requested !== undefined) return { value: requested, source: 'requested' };

  if (locale !== DEFAULT_LOCALE) {
    const fallback = dict[DEFAULT_LOCALE]?.[key];
    if (fallback !== undefined) return { value: fallback, source: 'fallback' };
  }
  return { value: key, source: 'missing' };
}
```

- [ ] **Step 7: Re-run test**

Run: `pnpm --filter @kitup/shared-i18n test`
Expected: PASS (4/4).

- [ ] **Step 8: Write `packages/shared-i18n/src/index.ts`**

```ts
export * from './fallback';
export * from './keys';
```

- [ ] **Step 9: Typecheck**

Run: `pnpm --filter @kitup/shared-i18n typecheck`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add packages/shared-i18n pnpm-lock.yaml
git commit -m "feat(i18n): shared-i18n package with fallback resolver and key constants"
```

---

### Task 2.2: `supabase-clients` shared factory (browser + edge variants)

**Files:**
- Create: `packages/supabase-clients/package.json`
- Create: `packages/supabase-clients/tsconfig.json`
- Create: `packages/supabase-clients/src/index.ts`
- Create: `packages/supabase-clients/src/browser.ts`
- Create: `packages/supabase-clients/src/edge.ts`

- [ ] **Step 1: Write `packages/supabase-clients/package.json`**

```json
{
  "name": "@kitup/supabase-clients",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --max-warnings 0"
  },
  "dependencies": {
    "@kitup/shared-types": "workspace:*",
    "@supabase/supabase-js": "^2.46.1"
  },
  "devDependencies": {
    "@kitup/eslint-config": "workspace:*",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: Write `packages/supabase-clients/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write `packages/supabase-clients/src/browser.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@kitup/shared-types';

export type Kitup = SupabaseClient<Database>;

export function createBrowserClient(args: {
  url: string;
  anonKey: string;
  storage?: any;
}): Kitup {
  return createClient<Database>(args.url, args.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: args.storage,
    },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}
```

- [ ] **Step 4: Write `packages/supabase-clients/src/edge.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@kitup/shared-types';

export function createEdgeClient(args: {
  url: string;
  serviceRoleKey: string;
}): SupabaseClient<Database> {
  return createClient<Database>(args.url, args.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 5: Write `packages/supabase-clients/src/index.ts`**

```ts
export * from './browser';
export * from './edge';
```

- [ ] **Step 6: Install + typecheck**

Run: `pnpm install && pnpm --filter @kitup/supabase-clients typecheck`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add packages/supabase-clients pnpm-lock.yaml
git commit -m "feat(db): supabase client factories (browser + edge variants)"
```

---

## Phase 3 — Mobile skeleton

### Task 3.1: Initialize Expo app

**Files:**
- Create: `apps/mobile/` (via Expo template)
- Modify: `apps/mobile/package.json` (add workspace deps + scripts)
- Create: `apps/mobile/.eslintrc.cjs`

- [ ] **Step 1: Scaffold the app**

From the repo root:
```bash
pnpm dlx create-expo-app@latest apps/mobile --template tabs --no-install
```
Expected: `apps/mobile/` populated with Expo Router tabs template.

- [ ] **Step 2: Replace `apps/mobile/package.json`**

```json
{
  "name": "@kitup/mobile",
  "version": "0.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "jest --passWithNoTests"
  },
  "dependencies": {
    "@kitup/shared-types": "workspace:*",
    "@kitup/shared-i18n": "workspace:*",
    "@kitup/supabase-clients": "workspace:*",
    "@supabase/supabase-js": "^2.46.1",
    "@tanstack/react-query": "^5.59.16",
    "@tanstack/query-async-storage-persister": "^5.59.16",
    "@tanstack/react-query-persist-client": "^5.59.16",
    "expo": "~52.0.0",
    "expo-apple-authentication": "~7.0.0",
    "expo-image": "~2.0.0",
    "expo-linking": "~7.0.0",
    "expo-notifications": "~0.29.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-mmkv": "^3.1.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@kitup/eslint-config": "workspace:*",
    "@types/jest": "^29.5.13",
    "@types/react": "~18.3.12",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0",
    "@testing-library/react-native": "^12.8.0",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 3: Write `apps/mobile/.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  extends: ["@kitup/eslint-config/react-native"],
  ignorePatterns: ["node_modules", ".expo", "dist", "ios", "android"],
};
```

- [ ] **Step 4: Add Jest config to `apps/mobile/package.json`**

Append to the package.json:
```json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterEach": ["<rootDir>/jest.setup.ts"],
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo|expo-router|@kitup)/)"
  ]
}
```

- [ ] **Step 5: Write `apps/mobile/jest.setup.ts`**

```ts
import '@testing-library/react-native/extend-expect';
```

- [ ] **Step 6: Install**

Run: `pnpm install`
Expected: success.

- [ ] **Step 7: Smoke-build**

Run: `pnpm --filter @kitup/mobile typecheck`
Expected: clean (or fix import paths in template files).

- [ ] **Step 8: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(mobile): scaffold expo app with workspace deps"
```

---

### Task 3.2: Theme + fonts (dark + runic Norse aesthetic)

**Files:**
- Create: `apps/mobile/theme/tokens.ts`
- Create: `apps/mobile/theme/fonts.ts`
- Create: `apps/mobile/theme/ThemeProvider.tsx`
- Create: `apps/mobile/theme/index.ts`
- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/app.json` (or `app.config.ts`)

- [ ] **Step 1: Add font dependencies**

```bash
pnpm --filter @kitup/mobile add expo-font @expo-google-fonts/cinzel @expo-google-fonts/inter
```

- [ ] **Step 2: Write `apps/mobile/theme/tokens.ts`**

```ts
export const palette = {
  bg: '#0B0E14',
  bgElevated: '#141923',
  border: '#1F2735',
  textHigh: '#E8E6DC',
  textMid: '#A8A496',
  textLow: '#6B6859',
  accent: '#C9A96E',      // worn gold
  accentMuted: '#8C7349',
  danger: '#B0413E',
  success: '#5A8C5C',
  rune: '#D7C99A',
} as const;

export const radius = { sm: 6, md: 12, lg: 20, full: 9999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, hero: 36 } as const;
```

- [ ] **Step 3: Write `apps/mobile/theme/fonts.ts`**

```ts
import {
  Cinzel_400Regular, Cinzel_600SemiBold, Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export const fontMap = {
  Cinzel_400Regular, Cinzel_600SemiBold, Cinzel_700Bold,
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
};

export const fontFamily = {
  display: 'Cinzel_700Bold',
  displayRegular: 'Cinzel_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
} as const;
```

- [ ] **Step 4: Write `apps/mobile/theme/ThemeProvider.tsx`**

```tsx
import { createContext, useContext, type PropsWithChildren } from 'react';
import { palette, radius, space, fontSize } from './tokens';
import { fontFamily } from './fonts';

const themeValue = { palette, radius, space, fontSize, fontFamily };
type Theme = typeof themeValue;

const Ctx = createContext<Theme>(themeValue);

export function ThemeProvider({ children }: PropsWithChildren) {
  return <Ctx.Provider value={themeValue}>{children}</Ctx.Provider>;
}

export function useTheme(): Theme {
  return useContext(Ctx);
}
```

- [ ] **Step 5: Write `apps/mobile/theme/index.ts`**

```ts
export * from './tokens';
export * from './fonts';
export * from './ThemeProvider';
```

- [ ] **Step 6: Update `apps/mobile/app/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, fontMap, palette } from '../theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: palette.bg },
            headerTintColor: palette.textHigh,
            contentStyle: { backgroundColor: palette.bg },
          }}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter @kitup/mobile typecheck`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(mobile): dark Norse theme tokens, Cinzel + Inter fonts, ThemeProvider"
```

---

### Task 3.3: Supabase client + MMKV storage adapter

**Files:**
- Create: `apps/mobile/lib/storage.ts`
- Create: `apps/mobile/lib/supabase.ts`
- Create: `apps/mobile/lib/queryClient.ts`
- Create: `apps/mobile/lib/env.ts`
- Modify: `apps/mobile/app.json` (extra env exposure via `expo-constants`)

- [ ] **Step 1: Write `apps/mobile/lib/storage.ts`**

```ts
import { MMKV } from 'react-native-mmkv';

export const mmkv = new MMKV({ id: 'kitup' });

export const mmkvStorageAdapter = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
};
```

- [ ] **Step 2: Write `apps/mobile/lib/env.ts`**

```ts
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

function required(name: string): string {
  const v = extra[name] ?? process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
};
```

- [ ] **Step 3: Update `apps/mobile/app.json` to expose env**

Inside the `expo` block, add:
```json
"extra": {
  "SUPABASE_URL": process.env.SUPABASE_URL,
  "SUPABASE_ANON_KEY": process.env.SUPABASE_ANON_KEY
}
```
(If `app.json`, switch to `app.config.ts` so JS expressions are valid; the create-expo template generally uses `app.json` — convert it.)

- [ ] **Step 4: Convert `apps/mobile/app.json` to `apps/mobile/app.config.ts`**

```ts
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'kitUP Norse',
  slug: 'kitup-norse',
  scheme: 'kitup',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'dark',
  ios: { supportsTablet: false, bundleIdentifier: 'com.kitup.norse' },
  android: { package: 'com.kitup.norse' },
  web: { bundler: 'metro' },
  plugins: ['expo-router', 'expo-font', 'expo-secure-store'],
  experiments: { typedRoutes: true },
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};
export default config;
```
Delete `apps/mobile/app.json` after this.

- [ ] **Step 5: Write `apps/mobile/lib/supabase.ts`**

```ts
import { createBrowserClient } from '@kitup/supabase-clients';
import { env } from './env';
import { mmkvStorageAdapter } from './storage';

export const supabase = createBrowserClient({
  url: env.supabaseUrl,
  anonKey: env.supabaseAnonKey,
  storage: mmkvStorageAdapter,
});
```

- [ ] **Step 6: Write `apps/mobile/lib/queryClient.ts`**

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

- [ ] **Step 7: Add QueryClientProvider to `_layout.tsx`** (above ThemeProvider)

Insert:
```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
```
Wrap children:
```tsx
<QueryClientProvider client={queryClient}>
  <ThemeProvider>...</ThemeProvider>
</QueryClientProvider>
```

- [ ] **Step 8: Typecheck**

Run: `pnpm --filter @kitup/mobile typecheck`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile
git commit -m "feat(mobile): supabase client, MMKV storage, TanStack Query provider"
```

---

### Task 3.4: Anonymous auth bootstrap + session store

**Files:**
- Create: `apps/mobile/features/auth/store.ts`
- Create: `apps/mobile/features/auth/bootstrap.ts`
- Create: `apps/mobile/features/auth/__tests__/store.test.ts`
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Write the failing test**

`apps/mobile/features/auth/__tests__/store.test.ts`:

```ts
import { useAuthStore } from '../store';

describe('auth store', () => {
  beforeEach(() => useAuthStore.setState({ session: null, status: 'idle' }));

  it('starts in idle status', () => {
    expect(useAuthStore.getState().status).toBe('idle');
  });

  it('sets session and status to authenticated', () => {
    useAuthStore.getState().setSession({ user: { id: 'u1' } } as any);
    const s = useAuthStore.getState();
    expect(s.status).toBe('authenticated');
    expect(s.session?.user.id).toBe('u1');
  });

  it('clearSession resets to anonymous status when isAnonymous=true is set on bootstrap', () => {
    useAuthStore.getState().setSession({ user: { id: 'u1' } } as any);
    useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().status).toBe('idle');
    expect(useAuthStore.getState().session).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm --filter @kitup/mobile test`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `apps/mobile/features/auth/store.ts`**

```ts
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error';

type AuthState = {
  session: Session | null;
  status: AuthStatus;
  error?: string;
  setStatus: (s: AuthStatus, error?: string) => void;
  setSession: (s: Session | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  status: 'idle',
  setStatus: (status, error) => set({ status, error }),
  setSession: (session) =>
    set({ session, status: session ? 'authenticated' : 'idle', error: undefined }),
  clearSession: () => set({ session: null, status: 'idle', error: undefined }),
}));
```

- [ ] **Step 4: Re-run test**

Run: `pnpm --filter @kitup/mobile test`
Expected: PASS.

- [ ] **Step 5: Write `apps/mobile/features/auth/bootstrap.ts`**

```ts
import { supabase } from '../../lib/supabase';
import { useAuthStore } from './store';

export async function bootstrapAuth(): Promise<void> {
  useAuthStore.getState().setStatus('authenticating');

  const { data: { session: existing } } = await supabase.auth.getSession();
  if (existing) {
    useAuthStore.getState().setSession(existing);
    subscribe();
    return;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    useAuthStore.getState().setStatus('error', error?.message ?? 'sign-in failed');
    return;
  }
  useAuthStore.getState().setSession(data.session);
  subscribe();
}

function subscribe() {
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
  });
}
```

- [ ] **Step 6: Wire into `_layout.tsx`** — call `bootstrapAuth` in a `useEffect`:

```tsx
import { bootstrapAuth } from '../features/auth/bootstrap';

useEffect(() => {
  if (fontsLoaded) {
    SplashScreen.hideAsync();
    bootstrapAuth();
  }
}, [fontsLoaded]);
```

- [ ] **Step 7: Typecheck + test**

Run: `pnpm --filter @kitup/mobile typecheck && pnpm --filter @kitup/mobile test`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile
git commit -m "feat(mobile): anonymous auth bootstrap + zustand session store"
```

---

## Phase 4 — Admin skeleton

### Task 4.1: Initialize Next.js admin app

**Files:**
- Create: `apps/admin/` (via `create-next-app`)
- Replace: `apps/admin/package.json`
- Create: `apps/admin/.eslintrc.cjs`

- [ ] **Step 1: Scaffold**

```bash
pnpm dlx create-next-app@latest apps/admin --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-pnpm --no-install
```
Expected: `apps/admin/` populated.

- [ ] **Step 2: Replace `apps/admin/package.json`**

```json
{
  "name": "@kitup/admin",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@kitup/shared-types": "workspace:*",
    "@kitup/shared-i18n": "workspace:*",
    "@kitup/supabase-clients": "workspace:*",
    "@supabase/ssr": "^0.5.1",
    "@supabase/supabase-js": "^2.46.1",
    "@tanstack/react-query": "^5.59.16",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-tabs": "^1.1.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.453.0",
    "next": "15.0.2",
    "react": "19.0.0-rc",
    "react-dom": "19.0.0-rc",
    "tailwind-merge": "^2.5.4",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@kitup/eslint-config": "workspace:*",
    "@types/node": "^22",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.20",
    "eslint-config-next": "15.0.2",
    "postcss": "^8",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 3: Write `apps/admin/.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  extends: ["@kitup/eslint-config/next"],
  ignorePatterns: ["node_modules", ".next", "dist"],
};
```

- [ ] **Step 4: Install + smoke**

```bash
pnpm install
pnpm --filter @kitup/admin typecheck
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/admin pnpm-lock.yaml
git commit -m "feat(admin): scaffold next.js 15 app with workspace deps"
```

---

### Task 4.2: Admin theme tokens + shadcn primitives

**Files:**
- Create: `apps/admin/src/lib/utils.ts`
- Create: `apps/admin/src/components/ui/button.tsx`
- Create: `apps/admin/src/components/ui/input.tsx`
- Create: `apps/admin/src/components/ui/card.tsx`
- Create: `apps/admin/src/components/ui/table.tsx`
- Create: `apps/admin/src/components/ui/dialog.tsx`
- Modify: `apps/admin/src/app/globals.css`
- Modify: `apps/admin/tailwind.config.ts`

- [ ] **Step 1: Write `apps/admin/src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Update `apps/admin/tailwind.config.ts`** to include the same Norse palette:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0E14',
        bgElevated: '#141923',
        border: '#1F2735',
        textHigh: '#E8E6DC',
        textMid: '#A8A496',
        accent: '#C9A96E',
        accentMuted: '#8C7349',
        danger: '#B0413E',
        success: '#5A8C5C',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 3: Replace `apps/admin/src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root { color-scheme: dark; }
  body {
    @apply bg-bg text-textHigh font-body min-h-screen;
  }
  h1, h2, h3 { @apply font-display; }
}
```

- [ ] **Step 4: Write the shadcn primitives**

Use the standard shadcn-ui Button/Input/Card/Table/Dialog source. For brevity in this plan, run:

```bash
pnpm dlx shadcn@latest init --yes --base-color slate --style default
pnpm dlx shadcn@latest add button input card table dialog dropdown-menu
```

Adjust `components.json` to point at `src/components/ui` and `src/lib/utils`.

- [ ] **Step 5: Smoke test**

Replace `apps/admin/src/app/page.tsx`:

```tsx
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <main className="p-12 space-y-4">
      <h1 className="text-3xl">kitUP Admin</h1>
      <p className="text-textMid">Norse Mythology content management</p>
      <Button>Test button</Button>
    </main>
  );
}
```

Run `pnpm --filter @kitup/admin dev`, visit http://localhost:3001 and verify the dark theme + button render.

- [ ] **Step 6: Commit**

```bash
git add apps/admin pnpm-lock.yaml
git commit -m "feat(admin): tailwind theme + shadcn primitives"
```

---

### Task 4.3: Admin Supabase server + browser clients (SSR)

**Files:**
- Create: `apps/admin/src/lib/supabase/server.ts`
- Create: `apps/admin/src/lib/supabase/browser.ts`
- Create: `apps/admin/src/lib/env.ts`
- Modify: `apps/admin/.env.local` (locally; not committed)

- [ ] **Step 1: Write `apps/admin/src/lib/env.ts`**

```ts
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};
```

- [ ] **Step 2: Write `apps/admin/src/lib/supabase/browser.ts`**

```ts
'use client';
import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';
import type { Database } from '@kitup/shared-types';
import { env } from '../env';

export function createBrowserClient() {
  return createSsrBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
```

- [ ] **Step 3: Write `apps/admin/src/lib/supabase/server.ts`**

```ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@kitup/shared-types';
import { env } from '../env';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (set) => {
        try {
          set.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* called from a Server Component – ignore */
        }
      },
    },
  });
}
```

- [ ] **Step 4: Add `.env.local`** (locally, gitignored) with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @kitup/admin typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): supabase ssr client (browser + server variants)"
```

---

### Task 4.4: Admin login (magic link) + role guard middleware

**Files:**
- Create: `apps/admin/src/app/login/page.tsx`
- Create: `apps/admin/src/app/login/actions.ts`
- Create: `apps/admin/src/middleware.ts`
- Create: `apps/admin/src/lib/auth/requireAdmin.ts`
- Create: `apps/admin/src/app/(admin)/layout.tsx`
- Move: existing CRUD routes under `apps/admin/src/app/(admin)/...`

- [ ] **Step 1: Write `apps/admin/src/app/login/actions.ts`**

```ts
'use server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { ok: false, error: 'Email is required.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
```

- [ ] **Step 2: Write `apps/admin/src/app/login/page.tsx`**

```tsx
import { sendMagicLink } from './actions';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <form action={sendMagicLink} className="space-y-4 w-full max-w-sm">
        <h1 className="text-2xl font-display">kitUP Admin Login</h1>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full px-3 py-2 bg-bgElevated border border-border rounded-md"
        />
        <button className="w-full px-3 py-2 bg-accent text-bg rounded-md">
          Send magic link
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Write `apps/admin/src/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (set) =>
          set.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();

  const isLogin = req.nextUrl.pathname.startsWith('/login');
  const isAuthCallback = req.nextUrl.pathname.startsWith('/auth/callback');

  if (!user && !isLogin && !isAuthCallback) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (user) {
    const role = (user.app_metadata as any)?.role;
    if (role !== 'admin' && !isLogin) {
      return NextResponse.redirect(new URL('/login?error=not_admin', req.url));
    }
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 4: Write `apps/admin/src/lib/auth/requireAdmin.ts`** (used in server components)

```ts
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../supabase/server';

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata as any)?.role;
  if (!user || role !== 'admin') redirect('/login');
  return { user, supabase };
}
```

- [ ] **Step 5: Create the (admin) layout group**

Move existing `src/app/page.tsx` to `src/app/(admin)/page.tsx`. Add `src/app/(admin)/layout.tsx`:

```tsx
import { requireAdmin } from '@/lib/auth/requireAdmin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
```

- [ ] **Step 6: Set the demo admin role manually via SQL**

Use `mcp__supabase__execute_sql` with:
```sql
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"'
)
where email = 'YOUR_DEMO_ADMIN_EMAIL_HERE';
```
Replace email with the demo account.

- [ ] **Step 7: Verify in dev**

Run `pnpm --filter @kitup/admin dev`. Hit `http://localhost:3001/`. Expected: redirect to `/login`. Send magic link, click it (Supabase Studio → Auth logs lets you copy the link if mail isn't configured), confirm redirect to `/`.

- [ ] **Step 8: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): magic link login + admin role guard middleware"
```

---

## Phase 5 — Backend-driven i18n

### Task 5.1: Seed minimal fallback translations

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Append seed SQL with the bootstrap dictionary** (so first-launch UX is not blank):

```sql
-- Seed: bootstrap UI strings (TR + EN) for the kitUP demo
insert into translations (key, locale, value) values
  ('app.name', 'tr', 'kitUP Norse'),
  ('app.name', 'en', 'kitUP Norse'),
  ('app.tagline', 'tr', 'Mitolojiyi günde 5 dakikada öğren'),
  ('app.tagline', 'en', 'Learn mythology in 5 minutes a day'),

  ('onboarding.welcome.title', 'tr', 'Hoş geldin, gezgin'),
  ('onboarding.welcome.title', 'en', 'Welcome, traveler'),
  ('onboarding.welcome.body', 'tr', 'Yggdrasil''ın dallarına çıkmaya hazır mısın?'),
  ('onboarding.welcome.body', 'en', 'Ready to climb the branches of Yggdrasil?'),
  ('onboarding.cta.continue', 'tr', 'Devam et'),
  ('onboarding.cta.continue', 'en', 'Continue'),
  ('onboarding.language.title', 'tr', 'Dilini seç'),
  ('onboarding.language.title', 'en', 'Choose your language'),

  ('tabs.today', 'tr', 'Bugün'),
  ('tabs.today', 'en', 'Today'),
  ('tabs.path', 'tr', 'Yol'),
  ('tabs.path', 'en', 'Path'),
  ('tabs.profile', 'tr', 'Profil'),
  ('tabs.profile', 'en', 'Profile'),

  ('today.streak.days_one', 'tr', '{{count}} gün'),
  ('today.streak.days_one', 'en', '{{count}} day'),
  ('today.streak.days_other', 'tr', '{{count}} gün'),
  ('today.streak.days_other', 'en', '{{count}} days'),
  ('today.reviews_due', 'tr', '{{count}} tekrar bekliyor'),
  ('today.reviews_due', 'en', '{{count}} reviews due'),
  ('today.cta.start', 'tr', 'Bugünün dersine başla'),
  ('today.cta.start', 'en', 'Start today''s lesson'),

  ('lesson.cta.continue_quiz', 'tr', 'Quiz''e geç'),
  ('lesson.cta.continue_quiz', 'en', 'Continue to quiz'),
  ('lesson.audio.play', 'tr', 'Dinle'),
  ('lesson.audio.play', 'en', 'Listen'),

  ('quiz.correct', 'tr', 'Doğru'),
  ('quiz.correct', 'en', 'Correct'),
  ('quiz.incorrect', 'tr', 'Yanlış'),
  ('quiz.incorrect', 'en', 'Incorrect'),
  ('quiz.explanation.title', 'tr', 'Açıklama'),
  ('quiz.explanation.title', 'en', 'Explanation'),
  ('quiz.submit', 'tr', 'Gönder'),
  ('quiz.submit', 'en', 'Submit'),
  ('quiz.next', 'tr', 'Sonraki'),
  ('quiz.next', 'en', 'Next'),
  ('quiz.finish', 'tr', 'Bitir'),
  ('quiz.finish', 'en', 'Finish'),

  ('day.complete.title', 'tr', 'Bugünlük yeterli'),
  ('day.complete.title', 'en', 'Enough for today'),
  ('day.complete.body', 'tr', 'Yarın seni bekliyorum.'),
  ('day.complete.body', 'en', 'I will await you tomorrow.'),

  ('profile.create_account', 'tr', 'Hesap oluştur'),
  ('profile.create_account', 'en', 'Create account'),
  ('profile.signin.apple', 'tr', 'Apple ile devam et'),
  ('profile.signin.apple', 'en', 'Continue with Apple'),
  ('profile.signin.email', 'tr', 'E-posta ile bağlan'),
  ('profile.signin.email', 'en', 'Link with email'),
  ('profile.language', 'tr', 'Dil'),
  ('profile.language', 'en', 'Language'),
  ('profile.notification_time', 'tr', 'Hatırlatma saati'),
  ('profile.notification_time', 'en', 'Reminder time'),
  ('profile.sign_out', 'tr', 'Çıkış yap'),
  ('profile.sign_out', 'en', 'Sign out'),

  ('notifications.daily.title', 'tr', 'Yggdrasil''ın çağrısı'),
  ('notifications.daily.title', 'en', 'A call from Yggdrasil'),
  ('notifications.daily.body', 'tr', 'Bugünkü ders seni bekliyor 🐺'),
  ('notifications.daily.body', 'en', 'Today''s lesson awaits 🐺')
on conflict (key, locale) do nothing;

-- Seed: app_config defaults
insert into app_config (key, value) values
  ('feature.streak.enabled', 'true'::jsonb),
  ('feature.spaced_repetition.enabled', 'true'::jsonb),
  ('feature.ai_generation.enabled', 'true'::jsonb),
  ('ai.gemini.model', '"gemini-2.5-flash"'::jsonb),
  ('content.daily_reminder.default_time', '"19:00"'::jsonb)
on conflict (key) do nothing;
```

- [ ] **Step 2: Apply seed via MCP**

Use `mcp__supabase__execute_sql` with the contents of `supabase/seed.sql`.

- [ ] **Step 3: Verify**

```sql
select count(*) from translations;
select count(*) from app_config;
```
Expected: ≥ 60 translation rows, 5 config rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat(i18n): seed bootstrap translations + default app_config"
```

---

### Task 5.2: Mobile i18n cache (pure logic, TDD)

**Files:**
- Create: `apps/mobile/features/i18n/cache.ts`
- Create: `apps/mobile/features/i18n/__tests__/cache.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/mobile/features/i18n/__tests__/cache.test.ts`:

```ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { I18nCache } from '../cache';

const STORAGE: Record<string, string> = {};
const fakeStorage = {
  getString: (k: string) => STORAGE[k],
  set: (k: string, v: string) => { STORAGE[k] = v; },
  delete: (k: string) => { delete STORAGE[k]; },
};

describe('I18nCache', () => {
  beforeEach(() => Object.keys(STORAGE).forEach((k) => delete STORAGE[k]));

  it('returns the cached value when present', () => {
    const cache = new I18nCache(fakeStorage as any);
    cache.upsert('tr', [{ key: 'a', value: 'A', updated_at: '2026-01-01T00:00:00Z' }]);
    expect(cache.get('a', 'tr')).toBe('A');
  });

  it('falls back to default locale (tr) when missing in requested locale', () => {
    const cache = new I18nCache(fakeStorage as any);
    cache.upsert('tr', [{ key: 'x', value: 'XTR', updated_at: '2026-01-01T00:00:00Z' }]);
    expect(cache.get('x', 'en')).toBe('XTR');
  });

  it('returns the key itself when missing in both locales', () => {
    const cache = new I18nCache(fakeStorage as any);
    expect(cache.get('missing.key', 'en')).toBe('missing.key');
  });

  it('returns the latest updated_at across cached locales', () => {
    const cache = new I18nCache(fakeStorage as any);
    cache.upsert('tr', [{ key: 'a', value: 'A', updated_at: '2026-01-01T00:00:00Z' }]);
    cache.upsert('en', [{ key: 'a', value: 'A', updated_at: '2026-02-01T00:00:00Z' }]);
    expect(cache.lastSyncedAt('en')).toBe('2026-02-01T00:00:00Z');
  });

  it('persists across new instances using the same storage', () => {
    const c1 = new I18nCache(fakeStorage as any);
    c1.upsert('tr', [{ key: 'a', value: 'A', updated_at: '2026-01-01T00:00:00Z' }]);
    const c2 = new I18nCache(fakeStorage as any);
    expect(c2.get('a', 'tr')).toBe('A');
  });
});
```

- [ ] **Step 2: Run, confirm fail**

Run: `pnpm --filter @kitup/mobile test`
Expected: FAIL — cache module not found.

- [ ] **Step 3: Implement `apps/mobile/features/i18n/cache.ts`**

```ts
import type { Locale } from '@kitup/shared-types';
import { resolveTranslation, type Dictionary } from '@kitup/shared-i18n';

type StorageLike = {
  getString: (k: string) => string | undefined;
  set: (k: string, v: string) => void;
  delete: (k: string) => void;
};

type Row = { key: string; value: string; updated_at: string };
type LocaleData = { entries: Record<string, string>; lastUpdated: string };

const KEY_PREFIX = 'i18n.v1.';

export class I18nCache {
  private memo: Partial<Record<Locale, LocaleData>> = {};

  constructor(private storage: StorageLike) {}

  private read(locale: Locale): LocaleData {
    if (this.memo[locale]) return this.memo[locale]!;
    const raw = this.storage.getString(`${KEY_PREFIX}${locale}`);
    const data: LocaleData = raw ? JSON.parse(raw) : { entries: {}, lastUpdated: '1970-01-01T00:00:00Z' };
    this.memo[locale] = data;
    return data;
  }

  private write(locale: Locale, data: LocaleData) {
    this.memo[locale] = data;
    this.storage.set(`${KEY_PREFIX}${locale}`, JSON.stringify(data));
  }

  upsert(locale: Locale, rows: Row[]): void {
    const cur = this.read(locale);
    let lastUpdated = cur.lastUpdated;
    for (const r of rows) {
      cur.entries[r.key] = r.value;
      if (r.updated_at > lastUpdated) lastUpdated = r.updated_at;
    }
    this.write(locale, { entries: cur.entries, lastUpdated });
  }

  get(key: string, locale: Locale): string {
    const dict: Dictionary = {
      tr: this.read('tr').entries,
      en: this.read('en').entries,
    };
    return resolveTranslation(key, locale, dict).value;
  }

  lastSyncedAt(locale: Locale): string {
    return this.read(locale).lastUpdated;
  }

  clear(): void {
    this.memo = {};
    (['tr', 'en'] as const).forEach((l) => this.storage.delete(`${KEY_PREFIX}${l}`));
  }
}
```

- [ ] **Step 4: Re-run test**

Run: `pnpm --filter @kitup/mobile test`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/features/i18n
git commit -m "feat(i18n): mobile cache with fallback resolution + persistent storage"
```

---

### Task 5.3: i18n sync + `useT` hook + Realtime subscription

**Files:**
- Create: `apps/mobile/features/i18n/sync.ts`
- Create: `apps/mobile/features/i18n/store.ts`
- Create: `apps/mobile/features/i18n/useT.ts`
- Create: `apps/mobile/features/i18n/index.ts`
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Write `apps/mobile/features/i18n/store.ts`**

```ts
import { create } from 'zustand';
import type { Locale } from '@kitup/shared-types';
import { I18nCache } from './cache';
import { mmkv } from '../../lib/storage';

const cache = new I18nCache(mmkv);

type State = {
  locale: Locale;
  ready: boolean;
  bump: number; // re-render trigger when cache updates
  setLocale: (l: Locale) => void;
  setReady: (r: boolean) => void;
  triggerRender: () => void;
};

export const useI18nStore = create<State>((set) => ({
  locale: 'tr',
  ready: false,
  bump: 0,
  setLocale: (locale) => set({ locale }),
  setReady: (ready) => set({ ready }),
  triggerRender: () => set((s) => ({ bump: s.bump + 1 })),
}));

export const i18nCache = cache;
```

- [ ] **Step 2: Write `apps/mobile/features/i18n/sync.ts`**

```ts
import type { Locale } from '@kitup/shared-types';
import { supabase } from '../../lib/supabase';
import { i18nCache, useI18nStore } from './store';

export async function syncTranslations(locale: Locale): Promise<void> {
  const since = i18nCache.lastSyncedAt(locale);
  const { data, error } = await supabase
    .from('translations')
    .select('key,value,updated_at')
    .eq('locale', locale)
    .gt('updated_at', since);
  if (error) {
    console.warn('[i18n sync] failed', error.message);
    return;
  }
  if (data && data.length > 0) {
    i18nCache.upsert(locale, data);
    useI18nStore.getState().triggerRender();
  }
}

export function subscribeTranslations(locale: Locale): () => void {
  const channel = supabase
    .channel(`translations:${locale}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'translations', filter: `locale=eq.${locale}` },
      (payload) => {
        const row = (payload.new ?? payload.old) as { key: string; value: string; updated_at: string };
        if (row && payload.new) {
          i18nCache.upsert(locale, [row]);
          useI18nStore.getState().triggerRender();
        }
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
```

- [ ] **Step 3: Write `apps/mobile/features/i18n/useT.ts`**

```ts
import { useCallback } from 'react';
import { useI18nStore, i18nCache } from './store';

export function useT() {
  const locale = useI18nStore((s) => s.locale);
  // bump dependency forces re-render when cache mutates
  useI18nStore((s) => s.bump);

  return useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const raw = i18nCache.get(key, locale);
      if (!vars) return raw;
      return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
    },
    [locale],
  );
}
```

- [ ] **Step 4: Write `apps/mobile/features/i18n/index.ts`**

```ts
export * from './useT';
export * from './store';
export * from './sync';
```

- [ ] **Step 5: Wire bootstrap into `_layout.tsx`**

Inside the existing `useEffect` (after fonts load), call:
```ts
import { syncTranslations, subscribeTranslations, useI18nStore } from '../features/i18n';

useEffect(() => {
  if (!fontsLoaded) return;
  let unsub: (() => void) | undefined;
  (async () => {
    const locale = useI18nStore.getState().locale;
    await syncTranslations(locale);
    useI18nStore.getState().setReady(true);
    unsub = subscribeTranslations(locale);
  })();
  return () => unsub?.();
}, [fontsLoaded]);
```

- [ ] **Step 6: Typecheck + test**

Run: `pnpm --filter @kitup/mobile typecheck && pnpm --filter @kitup/mobile test`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/features/i18n apps/mobile/app/_layout.tsx
git commit -m "feat(i18n): useT hook + delta sync + realtime subscription"
```

---

## Phase 6 — Mobile content reading flow

### Task 6.1: Onboarding + language pick

**Files:**
- Create: `apps/mobile/app/(onboarding)/_layout.tsx`
- Create: `apps/mobile/app/(onboarding)/welcome.tsx`
- Create: `apps/mobile/app/(onboarding)/why.tsx`
- Create: `apps/mobile/app/(onboarding)/language.tsx`
- Create: `apps/mobile/features/onboarding/store.ts`

- [ ] **Step 1: Write `apps/mobile/features/onboarding/store.ts`**

```ts
import { create } from 'zustand';
import { mmkv } from '../../lib/storage';

const KEY = 'onboarding.completed';

type State = {
  completed: boolean;
  setCompleted: () => void;
  reset: () => void;
};

export const useOnboarding = create<State>((set) => ({
  completed: mmkv.getBoolean(KEY) ?? false,
  setCompleted: () => { mmkv.set(KEY, true); set({ completed: true }); },
  reset: () => { mmkv.delete(KEY); set({ completed: false }); },
}));
```

- [ ] **Step 2: Write `apps/mobile/app/(onboarding)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Write `apps/mobile/app/(onboarding)/welcome.tsx`**

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function Welcome() {
  const t = useT();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
      <Text style={styles.body}>{t('onboarding.welcome.body')}</Text>
      <Pressable style={styles.cta} onPress={() => router.push('/(onboarding)/why')}>
        <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg, backgroundColor: palette.bg },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.hero },
  body: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.lg, lineHeight: 26 },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});
```

- [ ] **Step 4: Write `apps/mobile/app/(onboarding)/why.tsx`**

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function Why() {
  const t = useT();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>5 dakika · 21 gün</Text>
      <Text style={styles.body}>
        Her gün kısa bir hikaye, hızlı bir quiz. Yanlış bildiklerini sistem sana tekrar sorar — bilim destekli aralıklı tekrar.
      </Text>
      <Pressable style={styles.cta} onPress={() => router.push('/(onboarding)/language')}>
        <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg, backgroundColor: palette.bg },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xxl },
  body: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.md, lineHeight: 24 },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});
```

- [ ] **Step 5: Write `apps/mobile/app/(onboarding)/language.tsx`**

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useI18nStore, useT } from '../../features/i18n';
import { useOnboarding } from '../../features/onboarding/store';
import { palette, fontFamily, fontSize, space } from '../../theme';
import { syncTranslations } from '../../features/i18n';

export default function Language() {
  const t = useT();
  const setLocale = useI18nStore((s) => s.setLocale);
  const finish = useOnboarding((s) => s.setCompleted);

  async function pick(locale: 'tr' | 'en') {
    setLocale(locale);
    await syncTranslations(locale);
    finish();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.language.title')}</Text>
      <Pressable style={styles.option} onPress={() => pick('tr')}>
        <Text style={styles.optionText}>Türkçe</Text>
      </Pressable>
      <Pressable style={styles.option} onPress={() => pick('en')}>
        <Text style={styles.optionText}>English</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.xl, gap: space.md, backgroundColor: palette.bg, justifyContent: 'center' },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xxl, marginBottom: space.lg },
  option: { padding: space.lg, borderWidth: 1, borderColor: palette.border, borderRadius: 12, backgroundColor: palette.bgElevated },
  optionText: { fontFamily: fontFamily.bodyMedium, color: palette.textHigh, fontSize: fontSize.lg },
});
```

- [ ] **Step 6: Add an onboarding redirect in `apps/mobile/app/index.tsx`**

```tsx
import { Redirect } from 'expo-router';
import { useOnboarding } from '../features/onboarding/store';

export default function Index() {
  const completed = useOnboarding((s) => s.completed);
  return <Redirect href={completed ? '/(tabs)' : '/(onboarding)/welcome'} />;
}
```

- [ ] **Step 7: Smoke test**

Run `pnpm --filter @kitup/mobile start`, open in iOS Simulator, verify the 3-screen onboarding flows into `(tabs)`.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile
git commit -m "feat(mobile): onboarding flow with language picker"
```

---

### Task 6.2: Tabs (Today / Path / Profile) + course query hook

**Files:**
- Create: `apps/mobile/app/(tabs)/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/index.tsx` (Today)
- Create: `apps/mobile/app/(tabs)/path.tsx`
- Create: `apps/mobile/app/(tabs)/profile.tsx`
- Create: `apps/mobile/features/lessons/queries.ts`

- [ ] **Step 1: Write `apps/mobile/features/lessons/queries.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';

export function useActiveCourse() {
  return useQuery({
    queryKey: ['course', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useLessons(courseId: string | undefined) {
  return useQuery({
    enabled: !!courseId,
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId!)
        .order('day_number', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUserProgress() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    enabled: !!userId,
    queryKey: ['user_progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}
```

- [ ] **Step 2: Write `apps/mobile/app/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router';
import { useT } from '../../features/i18n';
import { palette } from '../../theme';

export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: palette.bgElevated, borderTopColor: palette.border },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMid,
        headerStyle: { backgroundColor: palette.bg },
        headerTintColor: palette.textHigh,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.today') }} />
      <Tabs.Screen name="path" options={{ title: t('tabs.path') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Write `apps/mobile/app/(tabs)/index.tsx`** (Today)

```tsx
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../../features/i18n';
import { useActiveCourse, useLessons, useUserProgress } from '../../features/lessons/queries';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function Today() {
  const t = useT();
  const course = useActiveCourse();
  const lessons = useLessons(course.data?.id);
  const progress = useUserProgress();

  if (course.isLoading || lessons.isLoading || progress.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={palette.accent} /></View>;
  }
  if (!course.data) {
    return <View style={styles.center}><Text style={styles.muted}>No course available</Text></View>;
  }

  const completed = new Set((progress.data ?? []).filter(p => p.completed_at).map(p => p.lesson_id));
  const todays = (lessons.data ?? []).find(l => !completed.has(l.id));

  if (!todays) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{t('day.complete.title')}</Text>
        <Text style={styles.muted}>{t('day.complete.body')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dayBadge}>Day {todays.day_number} / {course.data.day_count}</Text>
      <Text style={styles.title}>{t(todays.title_key)}</Text>
      <Pressable
        style={styles.cta}
        onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: todays.id } })}
      >
        <Text style={styles.ctaText}>{t('today.cta.start')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.xl, gap: space.md, backgroundColor: palette.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  dayBadge: { fontFamily: fontFamily.bodyMedium, color: palette.accent, fontSize: fontSize.sm, letterSpacing: 2 },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xxl },
  muted: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.md, textAlign: 'center', marginTop: space.md },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});
```

- [ ] **Step 4: Write `apps/mobile/app/(tabs)/path.tsx`**

```tsx
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../../features/i18n';
import { useActiveCourse, useLessons, useUserProgress } from '../../features/lessons/queries';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function Path() {
  const t = useT();
  const course = useActiveCourse();
  const lessons = useLessons(course.data?.id);
  const progress = useUserProgress();

  if (course.isLoading || lessons.isLoading || progress.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={palette.accent} /></View>;
  }
  const done = new Set((progress.data ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id));

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: space.lg, gap: space.sm }}
      data={lessons.data ?? []}
      keyExtractor={(l) => l.id}
      renderItem={({ item }) => {
        const isDone = done.has(item.id);
        return (
          <Pressable
            style={[styles.row, isDone && styles.rowDone]}
            onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: item.id } })}
          >
            <Text style={styles.day}>{item.day_number}</Text>
            <Text style={styles.title} numberOfLines={1}>{t(item.title_key)}</Text>
            <Text style={styles.tick}>{isDone ? '✓' : ''}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: palette.bgElevated, borderRadius: 10, borderWidth: 1, borderColor: palette.border },
  rowDone: { borderColor: palette.success },
  day: { fontFamily: fontFamily.display, color: palette.accent, fontSize: fontSize.lg, width: 32 },
  title: { fontFamily: fontFamily.body, color: palette.textHigh, fontSize: fontSize.md, flex: 1 },
  tick: { fontFamily: fontFamily.bodyMedium, color: palette.success, fontSize: fontSize.lg },
});
```

- [ ] **Step 5: Write `apps/mobile/app/(tabs)/profile.tsx`**

```tsx
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useT, useI18nStore, syncTranslations } from '../../features/i18n';
import { useAuthStore } from '../../features/auth/store';
import { palette, fontFamily, fontSize, space } from '../../theme';
import type { Locale } from '@kitup/shared-types';

export default function Profile() {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const session = useAuthStore((s) => s.session);

  async function pickLocale(l: Locale) {
    setLocale(l);
    await syncTranslations(l);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/(onboarding)/welcome');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View>
        <Text style={styles.label}>{t('profile.language')}</Text>
        <View style={styles.row}>
          {(['tr', 'en'] as const).map((l) => (
            <Pressable
              key={l}
              style={[styles.chip, locale === l && styles.chipActive]}
              onPress={() => pickLocale(l)}
            >
              <Text style={[styles.chipText, locale === l && styles.chipTextActive]}>{l.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Account section is filled in Phase 9 (Apple + magic link). For now, show placeholder text. */}
      <View>
        <Text style={styles.label}>{t('profile.create_account')}</Text>
        <Text style={styles.muted}>(Phase 9 fills in Apple + email forms here.)</Text>
      </View>

      {session && (
        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>{t('profile.sign_out')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  label: { fontFamily: fontFamily.bodyMedium, color: palette.textMid, fontSize: fontSize.sm, letterSpacing: 1.5, marginBottom: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  chip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.bgElevated },
  chipActive: { borderColor: palette.accent, backgroundColor: palette.accentMuted },
  chipText: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.sm },
  chipTextActive: { color: palette.textHigh },
  muted: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.sm },
  signOut: { marginTop: space.xl, padding: space.md, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: palette.danger },
  signOutText: { fontFamily: fontFamily.bodyMedium, color: palette.danger, fontSize: fontSize.md },
});
```

- [ ] **Step 6: Smoke test**

Run on the simulator, verify Today shows "Day 1 / 21" once content seeded (which happens in Phase 14, but a single demo lesson row inserted manually here is fine for testing).

- [ ] **Step 7: Commit**

```bash
git add apps/mobile
git commit -m "feat(mobile): Today/Path/Profile tabs + content queries"
```

---

### Task 6.3: Lesson detail screen

**Files:**
- Create: `apps/mobile/app/lesson/[id].tsx`
- Create: `apps/mobile/components/Markdown.tsx`
- Create: `apps/mobile/features/lessons/lessonQuery.ts`

- [ ] **Step 1: Add markdown dep**

```bash
pnpm --filter @kitup/mobile add react-native-markdown-display
```

- [ ] **Step 2: Write `apps/mobile/components/Markdown.tsx`**

```tsx
import Markdown from 'react-native-markdown-display';
import { palette, fontFamily, fontSize } from '../theme';

export default function Body({ children }: { children: string }) {
  return (
    <Markdown
      style={{
        body: { color: palette.textHigh, fontFamily: fontFamily.body, fontSize: fontSize.md, lineHeight: 24 },
        heading1: { color: palette.textHigh, fontFamily: fontFamily.display, fontSize: fontSize.xxl },
        heading2: { color: palette.textHigh, fontFamily: fontFamily.display, fontSize: fontSize.xl },
        em: { color: palette.accent },
        strong: { color: palette.rune },
        bullet_list: { color: palette.textMid },
      }}
    >
      {children}
    </Markdown>
  );
}
```

- [ ] **Step 3: Write `apps/mobile/features/lessons/lessonQuery.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function useLesson(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['lesson', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*, quizzes(id)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
```

- [ ] **Step 4: Write `apps/mobile/app/lesson/[id].tsx`**

```tsx
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useLesson } from '../../features/lessons/lessonQuery';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';
import Body from '../../components/Markdown';

export default function LessonScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useLesson(id);

  if (lesson.isLoading) return <View style={styles.center}><ActivityIndicator color={palette.accent} /></View>;
  if (!lesson.data) return null;

  const quizId = (lesson.data.quizzes as any)?.[0]?.id ?? (lesson.data.quizzes as any)?.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}>
      {lesson.data.hero_image_url && (
        <Image source={{ uri: lesson.data.hero_image_url }} style={styles.hero} contentFit="cover" />
      )}
      <Text style={styles.day}>Day {lesson.data.day_number}</Text>
      <Text style={styles.title}>{t(lesson.data.title_key)}</Text>
      <View style={{ height: space.md }} />
      <Body>{t(lesson.data.body_key)}</Body>
      {quizId && (
        <Pressable
          style={styles.cta}
          onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: quizId } })}
        >
          <Text style={styles.ctaText}>{t('lesson.cta.continue_quiz')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: palette.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  hero: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, marginBottom: space.lg },
  day: { fontFamily: fontFamily.bodyMedium, color: palette.accent, fontSize: fontSize.sm, letterSpacing: 2 },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xxl, marginTop: space.xs },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(mobile): lesson detail screen with markdown + hero image"
```

---

### Task 6.4: Quiz screen + scoring (TDD on scoring)

**Files:**
- Create: `apps/mobile/features/quiz/score.ts`
- Create: `apps/mobile/features/quiz/__tests__/score.test.ts`
- Create: `apps/mobile/features/quiz/quizQuery.ts`
- Create: `apps/mobile/app/quiz/[id].tsx`
- Create: `apps/mobile/app/lesson/complete.tsx`

- [ ] **Step 1: Write the failing scoring test**

`apps/mobile/features/quiz/__tests__/score.test.ts`:

```ts
import { computeQuizResult, type AnswerInput, type QuestionInput } from '../score';

const q1: QuestionInput = { id: 'q1', correctOptionIds: ['a'] };
const q2: QuestionInput = { id: 'q2', correctOptionIds: ['c'] };
const q3: QuestionInput = { id: 'q3', correctOptionIds: ['t'] };

describe('computeQuizResult', () => {
  it('returns 100 when all correct', () => {
    const answers: AnswerInput[] = [
      { questionId: 'q1', selectedOptionId: 'a' },
      { questionId: 'q2', selectedOptionId: 'c' },
      { questionId: 'q3', selectedOptionId: 't' },
    ];
    const r = computeQuizResult([q1, q2, q3], answers);
    expect(r.score).toBe(100);
    expect(r.wrongQuestionIds).toEqual([]);
  });

  it('returns the correct percentage and lists wrong question ids', () => {
    const answers: AnswerInput[] = [
      { questionId: 'q1', selectedOptionId: 'a' },     // correct
      { questionId: 'q2', selectedOptionId: 'wrong' }, // wrong
      { questionId: 'q3', selectedOptionId: 'wrong' }, // wrong
    ];
    const r = computeQuizResult([q1, q2, q3], answers);
    expect(r.score).toBe(33);
    expect(r.wrongQuestionIds).toEqual(['q2', 'q3']);
  });

  it('treats unanswered questions as wrong', () => {
    const r = computeQuizResult([q1, q2, q3], [{ questionId: 'q1', selectedOptionId: 'a' }]);
    expect(r.score).toBe(33);
    expect(r.wrongQuestionIds).toEqual(['q2', 'q3']);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

Run: `pnpm --filter @kitup/mobile test`
Expected: FAIL — `score` module not found.

- [ ] **Step 3: Implement `apps/mobile/features/quiz/score.ts`**

```ts
export type QuestionInput = { id: string; correctOptionIds: string[] };
export type AnswerInput = { questionId: string; selectedOptionId: string };

export type QuizResult = {
  score: number; // 0..100, integer
  wrongQuestionIds: string[];
};

export function computeQuizResult(
  questions: QuestionInput[],
  answers: AnswerInput[],
): QuizResult {
  const byQ = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));
  const wrong: string[] = [];
  let correct = 0;
  for (const q of questions) {
    const sel = byQ.get(q.id);
    if (sel && q.correctOptionIds.includes(sel)) correct++;
    else wrong.push(q.id);
  }
  const score = questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100);
  return { score, wrongQuestionIds: wrong };
}
```

- [ ] **Step 4: Re-run test → PASS (3/3)**

- [ ] **Step 5: Write `apps/mobile/features/quiz/quizQuery.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';

export function useQuiz(quizId: string | undefined) {
  return useQuery({
    enabled: !!quizId,
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, lesson_id, pass_threshold, quiz_questions(id, type, stem_key, explanation_key, position, quiz_options(id, label_key, is_correct, position))')
        .eq('id', quizId!)
        .single();
      if (error) throw error;
      const questions = (data.quiz_questions ?? [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((q: any) => ({
          ...q,
          options: (q.quiz_options ?? []).sort((a: any, b: any) => a.position - b.position),
          correctOptionIds: (q.quiz_options ?? []).filter((o: any) => o.is_correct).map((o: any) => o.id),
        }));
      return { ...data, questions };
    },
  });
}

export function useSubmitProgress() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { lessonId: string; score: number }) => {
      if (!userId) throw new Error('not authenticated');
      const { error } = await supabase.from('user_progress').upsert({
        user_id: userId,
        lesson_id: input.lessonId,
        completed_at: new Date().toISOString(),
        score: input.score,
        attempts: 1,
      }, { onConflict: 'user_id,lesson_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_progress'] }),
  });
}
```

- [ ] **Step 6: Write `apps/mobile/app/quiz/[id].tsx`**

```tsx
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { useQuiz, useSubmitProgress } from '../../features/quiz/quizQuery';
import { computeQuizResult } from '../../features/quiz/score';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function QuizScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const quiz = useQuiz(id);
  const submit = useSubmitProgress();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);

  if (quiz.isLoading || !quiz.data) {
    return <View style={styles.center}><ActivityIndicator color={palette.accent} /></View>;
  }

  const questions = quiz.data.questions as any[];
  const q = questions[step];
  const isLast = step === questions.length - 1;

  function pick(optionId: string) {
    setAnswers({ ...answers, [q.id]: optionId });
    setRevealed(true);
  }

  async function next() {
    setRevealed(false);
    if (isLast) {
      const result = computeQuizResult(
        questions.map((qq) => ({ id: qq.id, correctOptionIds: qq.correctOptionIds })),
        Object.entries(answers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
      );
      await submit.mutateAsync({ lessonId: quiz.data.lesson_id, score: result.score });
      router.replace({ pathname: '/lesson/complete', params: { score: String(result.score) } });
    } else {
      setStep(step + 1);
    }
  }

  const correctIds = new Set<string>(q.correctOptionIds);
  const selected = answers[q.id];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: space.lg }}>
      <Text style={styles.progress}>{step + 1} / {questions.length}</Text>
      <Text style={styles.stem}>{t(q.stem_key)}</Text>
      <View style={{ gap: space.sm, marginTop: space.lg }}>
        {q.options.map((o: any) => {
          const isCorrect = correctIds.has(o.id);
          const isSelected = selected === o.id;
          const tone = revealed
            ? isCorrect ? palette.success : isSelected ? palette.danger : palette.border
            : palette.border;
          return (
            <Pressable
              key={o.id}
              disabled={revealed}
              onPress={() => pick(o.id)}
              style={[styles.option, { borderColor: tone }]}
            >
              <Text style={styles.optionText}>{t(o.label_key)}</Text>
            </Pressable>
          );
        })}
      </View>
      {revealed && q.explanation_key && (
        <View style={styles.explanation}>
          <Text style={styles.explainTitle}>{t('quiz.explanation.title')}</Text>
          <Text style={styles.explainBody}>{t(q.explanation_key)}</Text>
        </View>
      )}
      {revealed && (
        <Pressable style={styles.cta} onPress={next}>
          <Text style={styles.ctaText}>
            {isLast ? t('quiz.finish') : t('quiz.next')}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: palette.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  progress: { fontFamily: fontFamily.bodyMedium, color: palette.accent, fontSize: fontSize.sm, letterSpacing: 2 },
  stem: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xl, marginTop: space.sm },
  option: { padding: space.md, borderRadius: 10, borderWidth: 1, backgroundColor: palette.bgElevated },
  optionText: { fontFamily: fontFamily.body, color: palette.textHigh, fontSize: fontSize.md },
  explanation: { marginTop: space.lg, padding: space.md, borderLeftWidth: 3, borderLeftColor: palette.accent, backgroundColor: palette.bgElevated },
  explainTitle: { fontFamily: fontFamily.bodyMedium, color: palette.accent, fontSize: fontSize.sm },
  explainBody: { fontFamily: fontFamily.body, color: palette.textHigh, fontSize: fontSize.md, marginTop: space.xs },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});
```

- [ ] **Step 7: Write `apps/mobile/app/lesson/complete.tsx`**

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function Complete() {
  const t = useT();
  const { score } = useLocalSearchParams<{ score: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('day.complete.title')}</Text>
      <Text style={styles.score}>{score}%</Text>
      <Text style={styles.body}>{t('day.complete.body')}</Text>
      <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl, gap: space.md, backgroundColor: palette.bg },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xxl, textAlign: 'center' },
  score: { fontFamily: fontFamily.display, color: palette.accent, fontSize: fontSize.hero },
  body: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.md, textAlign: 'center' },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12 },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});
```

- [ ] **Step 8: Run unit tests + simulator smoke**

Run: `pnpm --filter @kitup/mobile test`
Expected: PASS.
Run app, complete a quiz, see score screen, return to Today.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile
git commit -m "feat(mobile): quiz flow with TDD-covered scoring + day-complete screen"
```

---

## Phase 7 — Admin CRUD

### Task 7.1: Admin shell layout + nav

**Files:**
- Create: `apps/admin/src/app/(admin)/layout.tsx` (already exists — extend)
- Create: `apps/admin/src/components/AppNav.tsx`

- [ ] **Step 1: Write `apps/admin/src/components/AppNav.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/courses', label: 'Courses' },
  { href: '/lessons', label: 'Lessons' },
  { href: '/quizzes', label: 'Quizzes' },
  { href: '/translations', label: 'Translations' },
  { href: '/app-config', label: 'App Config' },
  { href: '/generate', label: 'Generate' },
];

export function AppNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-2 border-b border-border px-6 py-3">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm hover:bg-bgElevated',
            path?.startsWith(i.href) && 'bg-bgElevated text-accent'
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Update `apps/admin/src/app/(admin)/layout.tsx`**

```tsx
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { AppNav } from '@/components/AppNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 border-b border-border">
        <h1 className="font-display text-2xl">kitUP Admin</h1>
      </header>
      <AppNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): shell layout with nav"
```

---

### Task 7.2: Courses CRUD

**Files:**
- Create: `apps/admin/src/app/(admin)/courses/page.tsx`
- Create: `apps/admin/src/app/(admin)/courses/actions.ts`
- Create: `apps/admin/src/app/(admin)/courses/CourseForm.tsx`

- [ ] **Step 1: Write `apps/admin/src/app/(admin)/courses/actions.ts`**

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const upsert = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title_key: z.string().min(1),
  description_key: z.string().min(1),
  day_count: z.coerce.number().int().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  status: z.enum(['draft', 'published', 'archived']),
  cover_image_url: z.string().url().nullish(),
});

export async function upsertCourse(formData: FormData) {
  const parsed = upsert.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('courses').upsert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/courses');
  return { ok: true };
}

export async function deleteCourse(id: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/courses');
  return { ok: true };
}
```

- [ ] **Step 2: Write `apps/admin/src/app/(admin)/courses/CourseForm.tsx`**

A client component with form fields matching the schema (slug, title_key, description_key, day_count, difficulty, status, cover_image_url) using the shadcn `Input`, `Button`, `Card`. Submits via the `upsertCourse` server action.

```tsx
'use client';
import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { upsertCourse } from './actions';

type Course = {
  id?: string; slug: string; title_key: string; description_key: string;
  day_count: number; difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived'; cover_image_url?: string | null;
};

export function CourseForm({ initial }: { initial?: Course }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => start(async () => {
        const r = await upsertCourse(fd);
        setError(r.ok ? null : r.error ?? 'failed');
      })}
      className="space-y-3"
    >
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}
      <Input name="slug" placeholder="slug" defaultValue={initial?.slug} required />
      <Input name="title_key" placeholder="title key" defaultValue={initial?.title_key} required />
      <Input name="description_key" placeholder="description key" defaultValue={initial?.description_key} required />
      <Input name="day_count" type="number" min={1} defaultValue={initial?.day_count ?? 21} required />
      <select name="difficulty" defaultValue={initial?.difficulty ?? 'beginner'} className="bg-bgElevated border border-border rounded-md p-2">
        <option>beginner</option><option>intermediate</option><option>advanced</option>
      </select>
      <select name="status" defaultValue={initial?.status ?? 'draft'} className="bg-bgElevated border border-border rounded-md p-2">
        <option>draft</option><option>published</option><option>archived</option>
      </select>
      <Input name="cover_image_url" placeholder="https://..." defaultValue={initial?.cover_image_url ?? ''} />
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
      {error && <p className="text-danger text-sm">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 3: Write `apps/admin/src/app/(admin)/courses/page.tsx`**

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CourseForm } from './CourseForm';
import { Card } from '@/components/ui/card';
import { deleteCourse } from './actions';

export default async function CoursesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: courses } = await supabase
    .from('courses').select('*').order('created_at', { ascending: false });

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <section>
        <h2 className="text-xl font-display mb-4">Courses</h2>
        <div className="space-y-3">
          {(courses ?? []).map((c) => (
            <Card key={c.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{c.slug}</p>
                <p className="text-textMid text-sm">{c.day_count} days · {c.status}</p>
              </div>
              <form action={async () => { 'use server'; await deleteCourse(c.id); }}>
                <button className="text-danger text-sm">Delete</button>
              </form>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-display mb-4">New course</h2>
        <CourseForm />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app
git commit -m "feat(admin): courses CRUD page"
```

---

### Task 7.3: Lessons CRUD with drag-drop reorder

**Files:**
- Create: `apps/admin/src/app/(admin)/lessons/page.tsx`
- Create: `apps/admin/src/app/(admin)/lessons/[id]/page.tsx`
- Create: `apps/admin/src/app/(admin)/lessons/actions.ts`
- Create: `apps/admin/src/app/(admin)/lessons/SortableList.tsx`

- [ ] **Step 1: Add dnd-kit deps**

```bash
pnpm --filter @kitup/admin add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Write `apps/admin/src/app/(admin)/lessons/actions.ts`**

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const upsert = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  day_number: z.coerce.number().int().min(1),
  title_key: z.string().min(1),
  body_key: z.string().min(1),
  hero_image_url: z.string().url().nullish(),
  audio_url: z.string().url().nullish(),
  est_minutes: z.coerce.number().int().min(1).default(5),
});

export async function upsertLesson(formData: FormData) {
  const parsed = upsert.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('lessons').upsert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/lessons');
  return { ok: true };
}

export async function reorderLessons(courseId: string, ordered: { id: string }[]) {
  const supabase = await createServerSupabaseClient();
  // Two-pass to avoid unique(course_id, day_number) collisions.
  const offset = 1000;
  for (let i = 0; i < ordered.length; i++) {
    await supabase.from('lessons').update({ day_number: offset + i + 1 }).eq('id', ordered[i].id);
  }
  for (let i = 0; i < ordered.length; i++) {
    await supabase.from('lessons').update({ day_number: i + 1 }).eq('id', ordered[i].id);
  }
  revalidatePath(`/lessons`);
  return { ok: true };
}

export async function deleteLesson(id: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/lessons');
  return { ok: true };
}
```

- [ ] **Step 3: Write `apps/admin/src/app/(admin)/lessons/SortableList.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { reorderLessons } from './actions';

type L = { id: string; day_number: number; title_key: string };

function Row({ l }: { l: L }) {
  const { setNodeRef, listeners, attributes, transform, transition } = useSortable({ id: l.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...listeners}
      {...attributes}
      className="p-3 bg-bgElevated rounded-md border border-border flex justify-between items-center cursor-grab"
    >
      <span>Day {l.day_number} — {l.title_key}</span>
      <Link href={`/lessons/${l.id}`} className="text-accent text-sm">Edit</Link>
    </li>
  );
}

export function SortableList({ courseId, items: initial }: { courseId: string; items: L[] }) {
  const [items, setItems] = useState(initial);

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={async (e) => {
        if (!e.over || e.over.id === e.active.id) return;
        const oldIdx = items.findIndex((i) => i.id === e.active.id);
        const newIdx = items.findIndex((i) => i.id === e.over!.id);
        const moved = arrayMove(items, oldIdx, newIdx);
        setItems(moved);
        await reorderLessons(courseId, moved.map((m) => ({ id: m.id })));
      }}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">{items.map((l) => <Row key={l.id} l={l} />)}</ul>
      </SortableContext>
    </DndContext>
  );
}
```

- [ ] **Step 4: Write `apps/admin/src/app/(admin)/lessons/page.tsx`**

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SortableList } from './SortableList';

export default async function LessonsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: courses } = await supabase.from('courses').select('id, slug').order('created_at');

  const sections = await Promise.all(
    (courses ?? []).map(async (c) => {
      const { data: lessons } = await supabase
        .from('lessons').select('id, day_number, title_key')
        .eq('course_id', c.id).order('day_number');
      return { course: c, lessons: lessons ?? [] };
    }),
  );

  return (
    <div className="space-y-8">
      {sections.map(({ course, lessons }) => (
        <section key={course.id}>
          <h2 className="text-xl font-display mb-3">{course.slug}</h2>
          <SortableList courseId={course.id} items={lessons} />
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Write `apps/admin/src/app/(admin)/lessons/[id]/page.tsx`**

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { upsertLesson, deleteLesson } from '../actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function LessonEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: lesson } = await supabase.from('lessons').select('*').eq('id', id).single();
  if (!lesson) return <p>Not found</p>;

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-display mb-4">Day {lesson.day_number} — {lesson.title_key}</h2>
      <form action={upsertLesson} className="space-y-3">
        <input type="hidden" name="id" value={lesson.id} />
        <input type="hidden" name="course_id" value={lesson.course_id} />
        <input type="hidden" name="day_number" value={lesson.day_number} />
        <Input name="title_key" defaultValue={lesson.title_key} required />
        <Input name="body_key" defaultValue={lesson.body_key} required />
        <Input name="hero_image_url" defaultValue={lesson.hero_image_url ?? ''} placeholder="https://..." />
        <Input name="audio_url" defaultValue={lesson.audio_url ?? ''} placeholder="https://..." />
        <Input name="est_minutes" type="number" min={1} defaultValue={lesson.est_minutes} />
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
        </div>
      </form>
      <form action={async () => { 'use server'; await deleteLesson(lesson.id); }} className="mt-6">
        <button className="text-danger text-sm">Delete this lesson</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/admin pnpm-lock.yaml
git commit -m "feat(admin): lessons CRUD + drag-drop reorder"
```

---

### Task 7.4: Quizzes editor

**Files:**
- Create: `apps/admin/src/app/(admin)/quizzes/page.tsx`
- Create: `apps/admin/src/app/(admin)/quizzes/[lessonId]/page.tsx`
- Create: `apps/admin/src/app/(admin)/quizzes/actions.ts`

- [ ] **Step 1: Write actions for quiz, question, option upsert/delete + setCorrect.

`apps/admin/src/app/(admin)/quizzes/actions.ts`:

```ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function ensureQuiz(lessonId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('quizzes').select('id').eq('lesson_id', lessonId).maybeSingle();
  if (data) return data.id;
  const { data: created, error } = await supabase
    .from('quizzes').insert({ lesson_id: lessonId, pass_threshold: 60 }).select('id').single();
  if (error) throw error;
  return created.id;
}

const qSchema = z.object({
  id: z.string().uuid().optional(),
  quiz_id: z.string().uuid(),
  type: z.enum(['multiple_choice', 'true_false']),
  stem_key: z.string().min(1),
  explanation_key: z.string().nullish(),
  position: z.coerce.number().int().min(0),
});

export async function upsertQuestion(formData: FormData) {
  const parsed = qSchema.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('quiz_questions').upsert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/quizzes');
  return { ok: true };
}

const oSchema = z.object({
  id: z.string().uuid().optional(),
  question_id: z.string().uuid(),
  label_key: z.string().min(1),
  is_correct: z.coerce.boolean(),
  position: z.coerce.number().int().min(0),
});

export async function upsertOption(formData: FormData) {
  const parsed = oSchema.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('quiz_options').upsert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/quizzes');
  return { ok: true };
}

export async function deleteQuestion(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from('quiz_questions').delete().eq('id', id);
  revalidatePath('/quizzes');
}

export async function deleteOption(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from('quiz_options').delete().eq('id', id);
  revalidatePath('/quizzes');
}
```

- [ ] **Step 2: Write `apps/admin/src/app/(admin)/quizzes/page.tsx`**

```tsx
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function QuizzesIndex() {
  const supabase = await createServerSupabaseClient();
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, day_number, title_key, courses(slug)')
    .order('course_id, day_number');

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-display mb-3">Lessons → Quiz editor</h2>
      {(lessons ?? []).map((l: any) => (
        <Link key={l.id} href={`/quizzes/${l.id}`} className="block p-3 bg-bgElevated rounded-md border border-border hover:border-accent">
          <span className="text-textMid text-xs mr-2">{l.courses?.slug}</span>
          Day {l.day_number} — {l.title_key}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write `apps/admin/src/app/(admin)/quizzes/[lessonId]/page.tsx`**

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  ensureQuiz, upsertQuestion, upsertOption, deleteQuestion, deleteOption,
} from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function QuizEditor({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabase = await createServerSupabaseClient();
  const quizId = await ensureQuiz(lessonId);

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*, quiz_options(*)')
    .eq('quiz_id', quizId)
    .order('position');

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-display">Quiz for lesson {lessonId}</h2>

      {(questions ?? []).map((q: any) => (
        <section key={q.id} className="p-4 bg-bgElevated rounded-md border border-border space-y-3">
          <p className="font-medium">{q.stem_key} <span className="text-textMid text-xs">({q.type})</span></p>
          <ul className="space-y-1 text-sm">
            {(q.quiz_options ?? []).sort((a: any, b: any) => a.position - b.position).map((o: any) => (
              <li key={o.id} className="flex justify-between">
                <span>{o.is_correct ? '✓ ' : ''}{o.label_key}</span>
                <form action={async () => { 'use server'; await deleteOption(o.id); }}>
                  <button className="text-danger text-xs">remove</button>
                </form>
              </li>
            ))}
          </ul>

          <form action={upsertOption} className="flex gap-2 items-center">
            <input type="hidden" name="question_id" value={q.id} />
            <input type="hidden" name="position" value={(q.quiz_options ?? []).length} />
            <Input name="label_key" placeholder="option label key" required />
            <label className="text-sm flex items-center gap-1">
              <input type="checkbox" name="is_correct" value="true" /> correct
            </label>
            <Button type="submit">Add option</Button>
          </form>
          <form action={async () => { 'use server'; await deleteQuestion(q.id); }}>
            <button className="text-danger text-xs">delete question</button>
          </form>
        </section>
      ))}

      <section className="p-4 border border-dashed border-border rounded-md">
        <h3 className="font-medium mb-3">Add question</h3>
        <form action={upsertQuestion} className="space-y-2">
          <input type="hidden" name="quiz_id" value={quizId} />
          <input type="hidden" name="position" value={(questions ?? []).length} />
          <select name="type" className="bg-bg border border-border rounded-md p-2">
            <option value="multiple_choice">multiple_choice</option>
            <option value="true_false">true_false</option>
          </select>
          <Input name="stem_key" placeholder="stem translation key" required />
          <Input name="explanation_key" placeholder="explanation key (optional)" />
          <Button type="submit">Add</Button>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): quizzes editor (questions + options + correct mark)"
```

---

### Task 7.5: Translations editor

**Files:**
- Create: `apps/admin/src/app/(admin)/translations/page.tsx`
- Create: `apps/admin/src/app/(admin)/translations/actions.ts`
- Create: `apps/admin/src/app/(admin)/translations/Row.tsx`

- [ ] **Step 1: Write `apps/admin/src/app/(admin)/translations/actions.ts`**

```ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const upsert = z.object({
  key: z.string().min(1),
  locale: z.enum(['tr', 'en']),
  value: z.string(),
});

export async function upsertTranslation(formData: FormData) {
  const parsed = upsert.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('translations').upsert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/translations');
  return { ok: true };
}
```

- [ ] **Step 2: Write `apps/admin/src/app/(admin)/translations/page.tsx`**

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Row } from './Row';

export default async function TranslationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase
    .from('translations').select('*').order('key, locale');

  // Group by key
  const byKey = new Map<string, { tr?: string; en?: string }>();
  for (const r of rows ?? []) {
    const cur = byKey.get(r.key) ?? {};
    cur[r.locale as 'tr' | 'en'] = r.value;
    byKey.set(r.key, cur);
  }
  const list = Array.from(byKey.entries()).map(([key, v]) => ({ key, ...v }));

  return (
    <div>
      <h2 className="text-xl font-display mb-4">Translations</h2>
      <div className="grid grid-cols-[2fr_3fr_3fr] gap-2 text-textMid text-sm border-b border-border pb-2">
        <span>Key</span><span>TR</span><span>EN</span>
      </div>
      {list.map((r) => (
        <Row key={r.key} k={r.key} tr={r.tr ?? ''} en={r.en ?? ''} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write `apps/admin/src/app/(admin)/translations/Row.tsx`**

```tsx
'use client';
import { useState, useTransition } from 'react';
import { upsertTranslation } from './actions';
import { cn } from '@/lib/utils';

export function Row({ k, tr, en }: { k: string; tr: string; en: string }) {
  const [pending, start] = useTransition();
  const [trVal, setTrVal] = useState(tr);
  const [enVal, setEnVal] = useState(en);

  function save(locale: 'tr' | 'en', value: string) {
    if ((locale === 'tr' ? tr : en) === value) return;
    const fd = new FormData();
    fd.set('key', k); fd.set('locale', locale); fd.set('value', value);
    start(() => upsertTranslation(fd));
  }

  return (
    <div className="grid grid-cols-[2fr_3fr_3fr] gap-2 py-1.5 border-b border-border items-center">
      <span className="text-xs text-textMid font-mono truncate" title={k}>{k}</span>
      <input
        value={trVal}
        onChange={(e) => setTrVal(e.target.value)}
        onBlur={(e) => save('tr', e.target.value)}
        className={cn(
          'bg-bgElevated border rounded-md px-2 py-1 text-sm',
          trVal ? 'border-border' : 'border-danger',
        )}
      />
      <input
        value={enVal}
        onChange={(e) => setEnVal(e.target.value)}
        onBlur={(e) => save('en', e.target.value)}
        className={cn(
          'bg-bgElevated border rounded-md px-2 py-1 text-sm',
          enVal ? 'border-border' : 'border-danger',
        )}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): translations editor with missing-key highlighting"
```

---

### Task 7.6: App config editor

**Files:**
- Create: `apps/admin/src/app/(admin)/app-config/page.tsx`
- Create: `apps/admin/src/app/(admin)/app-config/actions.ts`
- Create: `apps/admin/src/app/(admin)/app-config/Row.tsx`

- [ ] **Step 1: Write `apps/admin/src/app/(admin)/app-config/actions.ts`**

```ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const upsert = z.object({
  key: z.string().min(1),
  // value arrives as JSON string from a textarea; parse + validate.
  value_json: z.string().refine((s) => { try { JSON.parse(s); return true; } catch { return false; } }, 'invalid JSON'),
});

export async function upsertConfig(formData: FormData) {
  const parsed = upsert.parse(Object.fromEntries(formData));
  const value = JSON.parse(parsed.value_json);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('app_config').upsert({ key: parsed.key, value });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/app-config');
  return { ok: true };
}

export async function deleteConfig(key: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from('app_config').delete().eq('key', key);
  revalidatePath('/app-config');
}
```

- [ ] **Step 2: Write `apps/admin/src/app/(admin)/app-config/Row.tsx`**

```tsx
'use client';
import { useState, useTransition } from 'react';
import { upsertConfig, deleteConfig } from './actions';
import { Button } from '@/components/ui/button';

export function Row({ k, value }: { k: string; value: unknown }) {
  const [pending, start] = useTransition();
  const [json, setJson] = useState(JSON.stringify(value, null, 2));
  const [err, setErr] = useState<string | null>(null);

  function save() {
    setErr(null);
    const fd = new FormData();
    fd.set('key', k); fd.set('value_json', json);
    start(async () => {
      const r = await upsertConfig(fd);
      if (!r.ok) setErr(r.error ?? 'failed');
    });
  }

  return (
    <div className="p-3 bg-bgElevated rounded-md border border-border space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-mono text-sm">{k}</span>
        <form action={async () => { 'use server'; await deleteConfig(k); }}>
          <button className="text-danger text-xs">delete</button>
        </form>
      </div>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={Math.min(8, json.split('\n').length + 1)}
        className="w-full bg-bg border border-border rounded-md p-2 font-mono text-xs"
      />
      <div className="flex gap-2">
        <Button onClick={save} disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
        {err && <span className="text-danger text-xs self-center">{err}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `apps/admin/src/app/(admin)/app-config/page.tsx`**

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Row } from './Row';
import { upsertConfig } from './actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function AppConfigPage() {
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase.from('app_config').select('*').order('key');

  return (
    <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
      <section className="space-y-3">
        <h2 className="text-xl font-display">App config</h2>
        {(rows ?? []).map((r) => (
          <Row key={r.key} k={r.key} value={r.value} />
        ))}
      </section>
      <section>
        <h2 className="text-xl font-display mb-3">New key</h2>
        <form action={upsertConfig} className="space-y-2">
          <Input name="key" placeholder="feature.x.enabled" required />
          <textarea name="value_json" rows={4} placeholder="true" required className="w-full bg-bgElevated border border-border rounded-md p-2 font-mono text-xs" />
          <Button type="submit">Add</Button>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): app config (feature flags + remote config) editor"
```

---

## Phase 8 — AI generation pipeline (Gemini)

### Task 8.1: Course-generation prompt builder + JSON validator (TDD, runs in Edge function)

**Files:**
- Create: `supabase/functions/_shared/prompts.ts`
- Create: `supabase/functions/_shared/schema.ts`
- Create: `supabase/functions/_shared/__tests__/prompts.test.ts`
- Create: `supabase/functions/_shared/__tests__/schema.test.ts`
- Create: `supabase/functions/_shared/deno.json`

- [ ] **Step 1: Write `supabase/functions/_shared/deno.json`**

```json
{
  "imports": {
    "@supabase/supabase-js": "jsr:@supabase/supabase-js@^2.46.1",
    "zod": "https://deno.land/x/zod@v3.23.8/mod.ts"
  },
  "tasks": {
    "test": "deno test --allow-env --allow-net"
  }
}
```

- [ ] **Step 2: Write `supabase/functions/_shared/schema.ts`**

```ts
import { z } from 'zod';

export const QuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false']),
  stem: z.string().min(3),
  options: z.array(z.object({ label: z.string().min(1), is_correct: z.boolean() })).min(2).max(4),
  explanation: z.string().optional(),
});

export const LessonSchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1),
  body: z.string().min(20),
  hero_image_prompt: z.string().optional(),
  est_minutes: z.number().int().min(1).max(20).default(5),
  quiz: z.object({
    pass_threshold: z.number().int().min(0).max(100).default(60),
    questions: z.array(QuestionSchema).min(1).max(5),
  }),
});

export const CourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  lessons: z.array(LessonSchema),
}).refine((c) => {
  const days = c.lessons.map((l) => l.day);
  const set = new Set(days);
  return set.size === days.length && Math.min(...days) === 1 && Math.max(...days) === days.length;
}, { message: 'lesson days must be a contiguous 1..N sequence' });

export type Course = z.infer<typeof CourseSchema>;
```

- [ ] **Step 3: Write the failing schema test**

`supabase/functions/_shared/__tests__/schema.test.ts`:

```ts
import { assertEquals, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { CourseSchema } from '../schema.ts';

Deno.test('valid 2-day course parses', () => {
  const c = {
    title: 'Test',
    description: 'A short course',
    difficulty: 'beginner',
    lessons: [
      { day: 1, title: 'A', body: 'Long enough body text.', est_minutes: 5,
        quiz: { pass_threshold: 60, questions: [
          { type: 'true_false', stem: 'Is Loki a god?', options: [
            { label: 'Yes', is_correct: true }, { label: 'No', is_correct: false }] }
        ]} },
      { day: 2, title: 'B', body: 'Long enough body text.', est_minutes: 5,
        quiz: { pass_threshold: 60, questions: [
          { type: 'true_false', stem: 'Is Thor red?', options: [
            { label: 'Red beard', is_correct: true }, { label: 'Blue', is_correct: false }] }
        ]} },
    ],
  };
  const parsed = CourseSchema.parse(c);
  assertEquals(parsed.lessons.length, 2);
});

Deno.test('non-contiguous days reject', () => {
  assertThrows(() => CourseSchema.parse({
    title: 'X', description: 'short body', difficulty: 'beginner',
    lessons: [
      { day: 1, title: 'A', body: 'long body text', est_minutes: 5,
        quiz: { pass_threshold: 60, questions: [{ type: 'true_false', stem: 'q', options: [
          { label: 'a', is_correct: true }, { label: 'b', is_correct: false }] }] } },
      { day: 3, title: 'B', body: 'long body text', est_minutes: 5,
        quiz: { pass_threshold: 60, questions: [{ type: 'true_false', stem: 'q', options: [
          { label: 'a', is_correct: true }, { label: 'b', is_correct: false }] }] } },
    ],
  }));
});
```

- [ ] **Step 4: Run schema test**

Run: `cd supabase/functions/_shared && deno test --allow-env`
Expected: FAIL on first run (schema not yet written) → PASS after Step 2 file exists.

- [ ] **Step 5: Write `supabase/functions/_shared/prompts.ts`**

```ts
export type GenerateCourseInput = {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dayCount: number;
  locale: 'tr' | 'en';
};

export function systemPrompt(): string {
  return `You generate microlearning course content.
Output STRICT JSON matching the schema you receive — no prose, no code fences.
Tone: atmospheric, concise, factually accurate. Each lesson body is 120–220 words of Markdown.
Each quiz has 3–5 questions mixing 'multiple_choice' and 'true_false'.
For mythology topics, only use well-attested myths from primary sources (Eddas etc.) — no neo-pagan inventions.`;
}

export function userPrompt(input: GenerateCourseInput): string {
  return `Generate a ${input.dayCount}-day course on "${input.topic}" at ${input.difficulty} level.
Language: ${input.locale === 'tr' ? 'Turkish' : 'English'}.
Lesson day numbers must be 1..${input.dayCount} contiguous.
Pass threshold per quiz: 60.`;
}

export function exampleShot(): { user: string; assistant: string } {
  return {
    user: 'Generate a 1-day Norse Mythology course at beginner in English.',
    assistant: JSON.stringify({
      title: 'Norse Mythology — Day 0 Sample',
      description: 'A one-day taster.',
      difficulty: 'beginner',
      lessons: [{
        day: 1,
        title: 'Yggdrasil: The World Tree',
        body: 'Yggdrasil is the immense ash tree at the center of the cosmos in Norse mythology...',
        est_minutes: 5,
        quiz: {
          pass_threshold: 60,
          questions: [
            { type: 'true_false', stem: 'Yggdrasil is described as an oak tree.',
              options: [{ label: 'True', is_correct: false }, { label: 'False', is_correct: true }],
              explanation: 'Yggdrasil is an immense ash tree.' },
          ],
        },
      }],
    }),
  };
}
```

- [ ] **Step 6: Write `supabase/functions/_shared/__tests__/prompts.test.ts`**

```ts
import { assert, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { userPrompt, systemPrompt, exampleShot } from '../prompts.ts';

Deno.test('userPrompt includes day count and topic', () => {
  const p = userPrompt({ topic: 'X', difficulty: 'beginner', dayCount: 5, locale: 'en' });
  assertStringIncludes(p, '5-day course on "X"');
  assertStringIncludes(p, 'Language: English');
});

Deno.test('systemPrompt instructs strict JSON', () => {
  assertStringIncludes(systemPrompt(), 'STRICT JSON');
});

Deno.test('exampleShot returns parseable JSON', () => {
  const ex = exampleShot();
  JSON.parse(ex.assistant); // throws if invalid
  assert(true);
});
```

- [ ] **Step 7: Run all `_shared` tests**

Run: `deno test supabase/functions/_shared`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/_shared
git commit -m "feat(ai): prompt builder + course JSON schema (TDD)"
```

---

### Task 8.2: `generate-course` Edge Function

**Files:**
- Create: `supabase/functions/generate-course/index.ts`
- Create: `supabase/functions/generate-course/gemini.ts`

- [ ] **Step 1: Write `supabase/functions/generate-course/gemini.ts`**

```ts
const ENDPOINT = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

export async function geminiGenerate(args: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  example?: { user: string; assistant: string };
  responseSchema: object;
}): Promise<unknown> {
  const contents: any[] = [];
  if (args.example) {
    contents.push({ role: 'user', parts: [{ text: args.example.user }] });
    contents.push({ role: 'model', parts: [{ text: args.example.assistant }] });
  }
  contents.push({ role: 'user', parts: [{ text: args.user }] });

  const body = {
    systemInstruction: { parts: [{ text: args.system }] },
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: args.responseSchema,
      temperature: 0.7,
    },
  };

  const res = await fetch(ENDPOINT(args.model, args.apiKey), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini returned empty content');
  return JSON.parse(text);
}
```

- [ ] **Step 2: Write `supabase/functions/generate-course/index.ts`**

```ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';
import { CourseSchema } from '../_shared/schema.ts';
import { systemPrompt, userPrompt, exampleShot, type GenerateCourseInput } from '../_shared/prompts.ts';
import { geminiGenerate } from './gemini.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiKey   = Deno.env.get('GEMINI_API_KEY')!;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const auth = req.headers.get('authorization');
  if (!auth) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(supabaseUrl, serviceKey, {
    global: { headers: { authorization: auth } },
  });

  // Verify the caller is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (user.app_metadata as any)?.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const input = (await req.json()) as GenerateCourseInput;

  // Insert job row with admin service client (bypasses RLS already; we use service)
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: job, error: jobErr } = await adminClient
    .from('generation_jobs')
    .insert({
      requested_by: user.id,
      type: 'course',
      input_payload: input,
      status: 'pending',
    })
    .select()
    .single();
  if (jobErr) return new Response(jobErr.message, { status: 500 });

  EdgeRuntime.waitUntil((async () => {
    await adminClient.from('generation_jobs').update({ status: 'running' }).eq('id', job.id);
    try {
      const model = (await adminClient.from('app_config').select('value').eq('key', 'ai.gemini.model').maybeSingle()).data?.value as string ?? 'gemini-2.5-flash';
      const raw = await geminiGenerate({
        apiKey: geminiKey,
        model,
        system: systemPrompt(),
        user: userPrompt(input),
        example: exampleShot(),
        responseSchema: courseResponseSchema(input.dayCount),
      });
      const parsed = CourseSchema.parse(raw);
      const courseId = await persistCourse(adminClient, parsed, input.locale);
      await adminClient.from('generation_jobs').update({ status: 'done', output_ref: courseId }).eq('id', job.id);
    } catch (e) {
      await adminClient.from('generation_jobs').update({ status: 'failed', error_msg: String(e) }).eq('id', job.id);
    }
  })());

  return new Response(JSON.stringify({ jobId: job.id }), {
    headers: { 'content-type': 'application/json' },
    status: 202,
  });
});

function courseResponseSchema(dayCount: number): object {
  return {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      description: { type: 'STRING' },
      difficulty: { type: 'STRING', enum: ['beginner', 'intermediate', 'advanced'] },
      lessons: {
        type: 'ARRAY',
        minItems: dayCount, maxItems: dayCount,
        items: {
          type: 'OBJECT',
          properties: {
            day: { type: 'INTEGER' },
            title: { type: 'STRING' },
            body: { type: 'STRING' },
            est_minutes: { type: 'INTEGER' },
            quiz: {
              type: 'OBJECT',
              properties: {
                pass_threshold: { type: 'INTEGER' },
                questions: {
                  type: 'ARRAY',
                  minItems: 3, maxItems: 5,
                  items: {
                    type: 'OBJECT',
                    properties: {
                      type: { type: 'STRING', enum: ['multiple_choice', 'true_false'] },
                      stem: { type: 'STRING' },
                      explanation: { type: 'STRING' },
                      options: {
                        type: 'ARRAY', minItems: 2, maxItems: 4,
                        items: {
                          type: 'OBJECT',
                          properties: {
                            label: { type: 'STRING' },
                            is_correct: { type: 'BOOLEAN' },
                          },
                          required: ['label', 'is_correct'],
                        },
                      },
                    },
                    required: ['type', 'stem', 'options'],
                  },
                },
              },
              required: ['pass_threshold', 'questions'],
            },
          },
          required: ['day', 'title', 'body', 'est_minutes', 'quiz'],
        },
      },
    },
    required: ['title', 'description', 'difficulty', 'lessons'],
  };
}

async function persistCourse(supabase: any, course: any, locale: string): Promise<string> {
  const slug = course.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60);
  const titleKey = `course.${slug}.title`;
  const descKey = `course.${slug}.description`;

  await supabase.from('translations').upsert([
    { key: titleKey, locale, value: course.title },
    { key: descKey,  locale, value: course.description },
  ]);

  const { data: c, error: cErr } = await supabase.from('courses').insert({
    slug, title_key: titleKey, description_key: descKey,
    day_count: course.lessons.length, difficulty: course.difficulty, status: 'draft',
  }).select('id').single();
  if (cErr) throw cErr;

  for (const l of course.lessons) {
    const lessonTitleKey = `lesson.${slug}.day${l.day}.title`;
    const lessonBodyKey  = `lesson.${slug}.day${l.day}.body`;
    await supabase.from('translations').upsert([
      { key: lessonTitleKey, locale, value: l.title },
      { key: lessonBodyKey,  locale, value: l.body },
    ]);
    const { data: lessonRow, error: lErr } = await supabase.from('lessons').insert({
      course_id: c.id, day_number: l.day,
      title_key: lessonTitleKey, body_key: lessonBodyKey,
      est_minutes: l.est_minutes,
    }).select('id').single();
    if (lErr) throw lErr;

    const { data: quizRow, error: qErr } = await supabase.from('quizzes')
      .insert({ lesson_id: lessonRow.id, pass_threshold: l.quiz.pass_threshold })
      .select('id').single();
    if (qErr) throw qErr;

    for (let qi = 0; qi < l.quiz.questions.length; qi++) {
      const q = l.quiz.questions[qi];
      const stemKey = `quiz.${slug}.day${l.day}.q${qi + 1}.stem`;
      const explKey = q.explanation ? `quiz.${slug}.day${l.day}.q${qi + 1}.expl` : null;
      const upserts = [{ key: stemKey, locale, value: q.stem }];
      if (explKey) upserts.push({ key: explKey, locale, value: q.explanation });
      await supabase.from('translations').upsert(upserts);

      const { data: qRow } = await supabase.from('quiz_questions').insert({
        quiz_id: quizRow.id, type: q.type,
        stem_key: stemKey, explanation_key: explKey, position: qi,
      }).select('id').single();

      for (let oi = 0; oi < q.options.length; oi++) {
        const o = q.options[oi];
        const labelKey = `quiz.${slug}.day${l.day}.q${qi + 1}.o${oi + 1}`;
        await supabase.from('translations').upsert([{ key: labelKey, locale, value: o.label }]);
        await supabase.from('quiz_options').insert({
          question_id: qRow.id, label_key: labelKey, is_correct: o.is_correct, position: oi,
        });
      }
    }
  }
  return c.id;
}
```

- [ ] **Step 3: Set Edge function secrets**

Use Supabase Studio (or CLI) to set secrets: `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.

- [ ] **Step 4: Deploy via MCP**

Use `mcp__supabase__deploy_edge_function` with name `generate-course` and the file contents.

- [ ] **Step 5: Smoke test from cURL** (admin JWT in `Authorization: Bearer ...`)

Expected: returns `{"jobId": "..."}` with status 202; row appears in `generation_jobs`; status flips to `running` then `done`; rows appear in `courses`/`lessons`/etc.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/generate-course
git commit -m "feat(ai): generate-course edge function (gemini + persist)"
```

---

### Task 8.3: `translate-content` Edge Function

**Files:**
- Create: `supabase/functions/translate-content/index.ts`
- Create: `supabase/functions/translate-content/translatePrompt.ts`

- [ ] **Step 1: Write `translatePrompt.ts`**

```ts
export function translateSystem(): string {
  return `You translate UI strings and lesson content while preserving Markdown, placeholders like {{var}}, and proper nouns (Norse god names: Loki, Þórr, Óðinn, etc.). Output strict JSON: { "translations": [ { "key": "...", "value": "..." } ] }.`;
}

export function translateUser(items: { key: string; source: string }[], targetLocale: string): string {
  return `Translate the following items to ${targetLocale === 'tr' ? 'Turkish' : 'English'}.\n` +
    JSON.stringify({ items }, null, 2);
}
```

- [ ] **Step 2: Write `index.ts`**

```ts
import { createClient } from '@supabase/supabase-js';
import { translateSystem, translateUser } from './translatePrompt.ts';
import { geminiGenerate } from '../generate-course/gemini.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiKey   = Deno.env.get('GEMINI_API_KEY')!;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const { sourceLocale, targetLocale, batchSize = 50 } = await req.json();
  const supabase = createClient(supabaseUrl, serviceKey);

  // Find keys present in source but missing in target
  const { data: missing, error } = await supabase.rpc('translations_missing_for', {
    p_source: sourceLocale, p_target: targetLocale, p_limit: batchSize,
  });
  if (error) return new Response(error.message, { status: 500 });
  if (!missing || missing.length === 0) return new Response(JSON.stringify({ translated: 0 }), { status: 200 });

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      translations: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: { key: { type: 'STRING' }, value: { type: 'STRING' } },
          required: ['key', 'value'],
        },
      },
    },
    required: ['translations'],
  };

  const raw = await geminiGenerate({
    apiKey: geminiKey,
    model: 'gemini-2.5-flash',
    system: translateSystem(),
    user: translateUser(missing.map((m: any) => ({ key: m.key, source: m.value })), targetLocale),
    responseSchema,
  }) as { translations: { key: string; value: string }[] };

  const rows = raw.translations.map((t) => ({ key: t.key, locale: targetLocale, value: t.value }));
  const { error: upErr } = await supabase.from('translations').upsert(rows);
  if (upErr) return new Response(upErr.message, { status: 500 });

  return new Response(JSON.stringify({ translated: rows.length }), { status: 200 });
});
```

- [ ] **Step 3: Add the SQL function `translations_missing_for` migration**

Create `supabase/migrations/20260504000003_translations_helper.sql`:

```sql
create or replace function public.translations_missing_for(
  p_source text, p_target text, p_limit int default 100
)
returns table(key text, value text)
language sql stable as $$
  select s.key, s.value
  from translations s
  left join translations t on t.key = s.key and t.locale = p_target
  where s.locale = p_source and t.key is null
  limit p_limit;
$$;
```

Apply via `mcp__supabase__apply_migration`.

- [ ] **Step 4: Deploy function via MCP** (`translate-content`).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/translate-content supabase/migrations
git commit -m "feat(ai): translate-content edge function + missing-keys helper"
```

---

### Task 8.4: Admin Generate UI with live status

**Files:**
- Create: `apps/admin/src/app/(admin)/generate/page.tsx`
- Create: `apps/admin/src/app/(admin)/generate/JobStatus.tsx`
- Create: `apps/admin/src/app/(admin)/generate/actions.ts`

- [ ] **Step 1: Write `apps/admin/src/app/(admin)/generate/actions.ts`**

```ts
'use server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function startGeneration(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: 'not authenticated' };

  const body = {
    topic: String(formData.get('topic') ?? ''),
    difficulty: String(formData.get('difficulty') ?? 'beginner'),
    dayCount: Number(formData.get('day_count') ?? 7),
    locale: String(formData.get('locale') ?? 'tr'),
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-course`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  const json = await res.json();
  return { ok: true, jobId: json.jobId };
}

export async function startTranslate() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/translate-content`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ sourceLocale: 'tr', targetLocale: 'en', batchSize: 200 }),
  });
}
```

- [ ] **Step 2: Write `apps/admin/src/app/(admin)/generate/JobStatus.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/browser';

export function JobStatus({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.from('generation_jobs').select('*').eq('id', jobId).single().then(({ data }) => setJob(data));

    const channel = supabase
      .channel(`job:${jobId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'generation_jobs', filter: `id=eq.${jobId}` },
        (payload) => setJob(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  if (!job) return <p className="text-textMid">Loading…</p>;
  return (
    <div className="p-4 bg-bgElevated rounded-md border border-border">
      <p className="font-medium">Status: <span className="text-accent">{job.status}</span></p>
      {job.status === 'done' && job.output_ref && (
        <p className="text-sm text-textMid">Course id: {job.output_ref}</p>
      )}
      {job.status === 'failed' && (
        <pre className="text-danger text-xs whitespace-pre-wrap">{job.error_msg}</pre>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write `apps/admin/src/app/(admin)/generate/page.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { startGeneration, startTranslate } from './actions';
import { JobStatus } from './JobStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function GeneratePage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <h2 className="text-xl font-display mb-3">Generate course</h2>
        <form
          action={async (fd) => {
            const r = await startGeneration(fd);
            r.ok ? setJobId(r.jobId!) : setError(r.error ?? 'failed');
          }}
          className="space-y-3"
        >
          <Input name="topic" placeholder="Topic (e.g. Greek Mythology)" required />
          <select name="difficulty" defaultValue="beginner" className="w-full bg-bgElevated border border-border rounded-md p-2">
            <option>beginner</option><option>intermediate</option><option>advanced</option>
          </select>
          <Input name="day_count" type="number" defaultValue={7} min={1} max={30} />
          <select name="locale" defaultValue="tr" className="w-full bg-bgElevated border border-border rounded-md p-2">
            <option value="tr">Turkish</option><option value="en">English</option>
          </select>
          <Button type="submit">Generate</Button>
          {error && <p className="text-danger text-sm">{error}</p>}
        </form>
        {jobId && <div className="mt-4"><JobStatus jobId={jobId} /></div>}
      </section>
      <section>
        <h2 className="text-xl font-display mb-3">Auto-translate</h2>
        <p className="text-textMid mb-3">Fill missing EN values from existing TR values.</p>
        <Button onClick={() => startTranslate()}>Translate TR → EN</Button>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Smoke test**

Submit a small course (3 days). Watch JobStatus flip pending → running → done. Open Supabase Studio, confirm rows in courses/lessons/quizzes.

- [ ] **Step 5: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): generate UI with realtime job status + auto-translate trigger"
```

---

## Phase 9 — Auth upgrade (Apple iOS + email magic link)

### Task 9.1: Email magic link from mobile

**Files:**
- Create: `apps/mobile/features/auth/magicLink.ts`
- Modify: `apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Write `apps/mobile/features/auth/magicLink.ts`**

```ts
import { supabase } from '../../lib/supabase';
import * as Linking from 'expo-linking';

export async function sendMagicLink(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const redirect = Linking.createURL('/auth/callback');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirect },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
```

- [ ] **Step 2: Add a deep-link handler `apps/mobile/app/auth/callback.tsx`**

```tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useURL } from 'expo-linking';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const url = useURL();
  useEffect(() => {
    if (!url) return;
    const params = new URL(url).searchParams;
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(() => router.replace('/(tabs)'));
    }
  }, [url]);
  return null;
}
```

- [ ] **Step 3: Add a "Link with email" form to Profile**

In `apps/mobile/app/(tabs)/profile.tsx`, replace the placeholder account section with:

```tsx
import { useState } from 'react';
import { TextInput } from 'react-native';
import { sendMagicLink } from '../../features/auth/magicLink';

const [email, setEmail] = useState('');
const [sent, setSent] = useState(false);
const [error, setError] = useState<string | null>(null);

async function onSendLink() {
  setError(null);
  const r = await sendMagicLink(email);
  r.ok ? setSent(true) : setError(r.error);
}

// Inside the JSX, replace the (Phase 9 fills…) Text with:
<View>
  <Text style={styles.label}>{t('profile.create_account')}</Text>
  <TextInput
    placeholder="you@example.com"
    placeholderTextColor={palette.textLow}
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
    style={{
      backgroundColor: palette.bgElevated, color: palette.textHigh,
      borderWidth: 1, borderColor: palette.border, borderRadius: 10,
      padding: space.md, fontFamily: fontFamily.body, fontSize: fontSize.md,
    }}
  />
  <Pressable
    style={{ marginTop: space.sm, padding: space.md, alignItems: 'center', borderRadius: 10, backgroundColor: palette.accent }}
    onPress={onSendLink}
  >
    <Text style={{ fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md }}>
      {t('profile.signin.email')}
    </Text>
  </Pressable>
  {sent && <Text style={[styles.muted, { color: palette.success, marginTop: space.sm }]}>Check your email.</Text>}
  {error && <Text style={[styles.muted, { color: palette.danger, marginTop: space.sm }]}>{error}</Text>}
</View>
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile
git commit -m "feat(auth): mobile magic link + deep link callback"
```

---

### Task 9.2: Apple Sign-In (iOS only)

**Files:**
- Create: `apps/mobile/features/auth/apple.ts`
- Modify: `apps/mobile/app/(tabs)/profile.tsx`
- Modify: `apps/mobile/app.config.ts` (add `expo-apple-authentication` plugin)

- [ ] **Step 1: Add Apple plugin to `app.config.ts`** — append to plugins:

```ts
plugins: [
  'expo-router',
  'expo-font',
  'expo-secure-store',
  ['expo-apple-authentication'],
],
ios: { supportsTablet: false, bundleIdentifier: 'com.kitup.norse', usesAppleSignIn: true },
```

- [ ] **Step 2: Write `apps/mobile/features/auth/apple.ts`**

```ts
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../lib/supabase';

export const appleAvailable = Platform.OS === 'ios';

export async function signInWithApple(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!appleAvailable) return { ok: false, error: 'iOS only' };
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return { ok: false, error: 'no identity token' };
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'apple sign-in failed' };
  }
}
```

- [ ] **Step 3: Add Apple button to Profile** — only render when `appleAvailable === true`.

```tsx
import * as AppleAuthentication from 'expo-apple-authentication';
import { appleAvailable, signInWithApple } from '../../features/auth/apple';

{appleAvailable && (
  <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
    cornerRadius={12}
    style={{ height: 48 }}
    onPress={() => signInWithApple()}
  />
)}
```

- [ ] **Step 4: Configure Apple in Supabase dashboard** — add Apple provider with Services ID + Secret Key (via Apple Developer account). Document in README.

- [ ] **Step 5: Test in iOS Simulator** with sandbox Apple ID.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(auth): apple sign-in (iOS only) wiring"
```

---

### Task 9.3: Promote profile.anonymous → false on link

The Supabase auth flow keeps the same `auth.users.id` when an anonymous user links an identity. We need to flip `profiles.anonymous` to `false`.

**Files:**
- Create: `supabase/migrations/20260504000004_link_identity_trigger.sql`

- [ ] **Step 1: Write the migration**

```sql
-- When a user gains an identity (apple/email/etc.), mark their profile as non-anonymous.
create or replace function public.handle_identity_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set anonymous = false where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_identity_added on auth.identities;
create trigger on_identity_added
  after insert on auth.identities
  for each row execute function public.handle_identity_link();
```

- [ ] **Step 2: Apply via MCP**, verify by linking an identity.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations
git commit -m "feat(auth): trigger to flip profile.anonymous on identity link"
```

---

## Phase 10 — Engagement (streak, push, spaced repetition)

### Task 10.1: Streak update on lesson completion (TDD)

**Files:**
- Create: `apps/mobile/features/streak/calc.ts`
- Create: `apps/mobile/features/streak/__tests__/calc.test.ts`
- Modify: `apps/mobile/features/quiz/quizQuery.ts` (call streak update after submitProgress)

- [ ] **Step 1: Write the failing test**

`apps/mobile/features/streak/__tests__/calc.test.ts`:

```ts
import { nextStreak } from '../calc';

describe('nextStreak', () => {
  it('starts at 1 when no prior activity', () => {
    expect(nextStreak({ lastActiveDate: null, currentStreak: 0, today: '2026-05-04' }))
      .toEqual({ currentStreak: 1, longestDelta: 1 });
  });
  it('increments when yesterday was active', () => {
    expect(nextStreak({ lastActiveDate: '2026-05-03', currentStreak: 4, today: '2026-05-04' }))
      .toEqual({ currentStreak: 5, longestDelta: 1 });
  });
  it('keeps streak unchanged when same-day activity', () => {
    expect(nextStreak({ lastActiveDate: '2026-05-04', currentStreak: 4, today: '2026-05-04' }))
      .toEqual({ currentStreak: 4, longestDelta: 0 });
  });
  it('resets to 1 when more than one day skipped', () => {
    expect(nextStreak({ lastActiveDate: '2026-05-01', currentStreak: 10, today: '2026-05-04' }))
      .toEqual({ currentStreak: 1, longestDelta: 0 });
  });
});
```

- [ ] **Step 2: Run, confirm fail.**

- [ ] **Step 3: Implement `apps/mobile/features/streak/calc.ts`**

```ts
type Args = {
  lastActiveDate: string | null;
  currentStreak: number;
  today: string; // YYYY-MM-DD
};

export function nextStreak(args: Args): { currentStreak: number; longestDelta: number } {
  if (!args.lastActiveDate) return { currentStreak: 1, longestDelta: 1 };
  if (args.lastActiveDate === args.today) {
    return { currentStreak: args.currentStreak, longestDelta: 0 };
  }
  const last = new Date(args.lastActiveDate + 'T00:00:00Z').getTime();
  const today = new Date(args.today + 'T00:00:00Z').getTime();
  const diffDays = Math.round((today - last) / 86_400_000);
  if (diffDays === 1) {
    return { currentStreak: args.currentStreak + 1, longestDelta: 1 };
  }
  return { currentStreak: 1, longestDelta: 0 };
}
```

- [ ] **Step 4: Re-run test → PASS.**

- [ ] **Step 5: Wire to lesson completion**

`apps/mobile/features/streak/update.ts`:

```ts
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { nextStreak } from './calc';

export async function bumpStreakForToday(): Promise<void> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) return;
  const today = new Date().toISOString().slice(0, 10);

  const { data: cur } = await supabase
    .from('user_streaks').select('*').eq('user_id', userId).maybeSingle();

  const { currentStreak, longestDelta } = nextStreak({
    lastActiveDate: cur?.last_active_date ?? null,
    currentStreak: cur?.current_streak ?? 0,
    today,
  });
  const longest = Math.max(cur?.longest_streak ?? 0, currentStreak);

  await supabase.from('user_streaks').upsert({
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longest,
    last_active_date: today,
  });
}
```

In `useSubmitProgress.onSuccess`, also call `bumpStreakForToday()`.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile
git commit -m "feat(streak): TDD streak calculator + write on lesson completion"
```

---

### Task 10.2: Daily reminder via Expo Notifications

**Files:**
- Create: `apps/mobile/features/notifications/schedule.ts`
- Modify: `apps/mobile/app/(tabs)/profile.tsx` (notification time picker)

- [ ] **Step 1: Add deps**

```bash
pnpm --filter @kitup/mobile add expo-notifications expo-device @react-native-community/datetimepicker
```

- [ ] **Step 2: Write `apps/mobile/features/notifications/schedule.ts`**

```ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { i18nCache, useI18nStore } from '../i18n';

export async function ensurePermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
}

export async function scheduleDailyReminder(time: { hour: number; minute: number }) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const locale = useI18nStore.getState().locale;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18nCache.get('notifications.daily.title', locale),
      body: i18nCache.get('notifications.daily.body', locale),
    },
    trigger: { hour: time.hour, minute: time.minute, repeats: true } as any,
  });
}
```

- [ ] **Step 3: In Profile, add a `<DateTimePicker mode="time">`**, save to `profiles.notification_time`, call `scheduleDailyReminder` on change.

- [ ] **Step 4: On app boot (`_layout.tsx`)**, call `ensurePermissions()` then re-`scheduleDailyReminder` from the user's saved profile time.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(notifications): daily reminder scheduled device-side"
```

---

### Task 10.3: Spaced repetition algorithm + review queue UI

**Files:**
- Create: `apps/mobile/features/sr/sm2.ts`
- Create: `apps/mobile/features/sr/__tests__/sm2.test.ts`
- Create: `apps/mobile/features/sr/queue.ts`
- Modify: `apps/mobile/features/quiz/quizQuery.ts` (write to `review_queue` on wrong answers)
- Modify: `apps/mobile/app/(tabs)/index.tsx` (show "X reviews due" badge)
- Create: `apps/mobile/app/review/index.tsx`

- [ ] **Step 1: Write the failing TDD test**

`apps/mobile/features/sr/__tests__/sm2.test.ts`:

```ts
import { nextInterval } from '../sm2';

describe('SM-2 lite nextInterval', () => {
  it('first wrong answer → 1 day, ease 2.5', () => {
    expect(nextInterval({ ease: 2.5, intervalDays: 0, correct: false }))
      .toEqual({ ease: 2.5, intervalDays: 1 });
  });
  it('correct review → interval *= ease, ease += 0.1 (capped at 3.0)', () => {
    expect(nextInterval({ ease: 2.5, intervalDays: 3, correct: true }))
      .toEqual({ ease: 2.6, intervalDays: 8 });
  });
  it('caps ease at 3.0', () => {
    expect(nextInterval({ ease: 3.0, intervalDays: 5, correct: true }).ease).toBe(3.0);
  });
  it('wrong review → reset to 1, ease -= 0.2 floor 1.3', () => {
    expect(nextInterval({ ease: 1.4, intervalDays: 8, correct: false }))
      .toEqual({ ease: 1.3, intervalDays: 1 });
  });
});
```

- [ ] **Step 2: Implement `apps/mobile/features/sr/sm2.ts`**

```ts
type In = { ease: number; intervalDays: number; correct: boolean };
type Out = { ease: number; intervalDays: number };

export function nextInterval(input: In): Out {
  if (!input.correct) {
    return { ease: Math.max(1.3, +(input.ease - 0.2).toFixed(2)), intervalDays: 1 };
  }
  const newEase = Math.min(3.0, +(input.ease + 0.1).toFixed(2));
  const baseInterval = input.intervalDays === 0 ? 1 : input.intervalDays;
  return { ease: newEase, intervalDays: Math.round(baseInterval * input.ease) };
}
```

- [ ] **Step 3: Re-run test → PASS (4/4).**

- [ ] **Step 4: Implement `apps/mobile/features/sr/queue.ts`**

```ts
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { nextInterval } from './sm2';

export async function enqueueWrong(questionIds: string[]): Promise<void> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId || questionIds.length === 0) return;
  const due = new Date();
  due.setDate(due.getDate() + 1);
  const rows = questionIds.map((q) => ({
    user_id: userId,
    question_id: q,
    due_at: due.toISOString(),
    interval_days: 1,
    ease_factor: 2.5,
  }));
  await supabase.from('review_queue').upsert(rows, { onConflict: 'user_id,question_id' });
}

export async function recordReview(reviewId: string, correct: boolean) {
  const { data: row } = await supabase.from('review_queue').select('*').eq('id', reviewId).single();
  if (!row) return;
  const { ease, intervalDays } = nextInterval({ ease: row.ease_factor, intervalDays: row.interval_days, correct });
  if (correct && intervalDays > 14) {
    await supabase.from('review_queue').delete().eq('id', reviewId);
    return;
  }
  const due = new Date();
  due.setDate(due.getDate() + intervalDays);
  await supabase.from('review_queue').update({
    ease_factor: ease, interval_days: intervalDays, due_at: due.toISOString(),
  }).eq('id', reviewId);
}

export async function dueCount(): Promise<number> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) return 0;
  const { count } = await supabase.from('review_queue')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId).lte('due_at', new Date().toISOString());
  return count ?? 0;
}
```

Note: `review_queue` needs a unique constraint on `(user_id, question_id)`. Add it via a small migration:

`supabase/migrations/20260504000005_review_queue_unique.sql`:
```sql
alter table review_queue add constraint review_queue_user_question_unique unique (user_id, question_id);
```

- [ ] **Step 5: Wire to quiz finish** — in the quiz `next` handler at the end (when all answered), call `enqueueWrong(result.wrongQuestionIds)` before navigating.

- [ ] **Step 6: Add review badge to Today tab** using `dueCount()` via `useQuery({ queryKey: ['reviews-due'], queryFn: dueCount })`.

- [ ] **Step 7: Implement `apps/mobile/app/review/index.tsx`** — fetch due reviews, render same Quiz UI but each wrong-answer call `recordReview(id, false)`, correct call `recordReview(id, true)`.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile supabase/migrations
git commit -m "feat(sr): SM-2 lite spaced repetition + review queue UI"
```

---

### Task 10.4: Nightly streak reconciler (Edge Function + cron)

**Files:**
- Create: `supabase/functions/streak-reconciler/index.ts`
- Create: `supabase/migrations/20260504000006_streak_reconciler_cron.sql`

- [ ] **Step 1: Write `supabase/functions/streak-reconciler/index.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async () => {
  const supabase = createClient(url, key);
  // Reset current_streak to 0 for users whose last_active_date is older than yesterday.
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const cutoff = yesterday.toISOString().slice(0, 10);
  const { error, count } = await supabase
    .from('user_streaks')
    .update({ current_streak: 0 })
    .lt('last_active_date', cutoff)
    .select('user_id', { count: 'exact', head: false });
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ reset: count ?? 0 }), { status: 200 });
});
```

- [ ] **Step 2: Migration to schedule via pg_cron**

```sql
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'streak-reconciler-nightly',
  '5 0 * * *',  -- 00:05 UTC daily
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/streak-reconciler',
    headers := jsonb_build_object(
      'authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'),
      'content-type', 'application/json'
    )
  );
  $$
);
```

(Set `app.supabase_url` and `app.supabase_service_role_key` as Postgres GUCs via Studio → Database → Settings.)

- [ ] **Step 3: Deploy edge function and apply migration via MCP. Smoke-trigger via SQL `select net.http_post(...);` and confirm a row updates.**

- [ ] **Step 4: Commit**

```bash
git add supabase
git commit -m "feat(streak): nightly reconciler edge function + pg_cron schedule"
```

---

## Phase 11 — Offline + Realtime sync

### Task 11.1: TanStack Query MMKV persist + lesson prefetch

**Files:**
- Create: `apps/mobile/lib/queryPersist.ts`
- Modify: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/features/lessons/prefetch.ts`

- [ ] **Step 1: Write `apps/mobile/lib/queryPersist.ts`**

```ts
import { mmkv } from './storage';

export const mmkvPersister = {
  persistClient: async (client: unknown) => {
    mmkv.set('rq.cache', JSON.stringify(client));
  },
  restoreClient: async () => {
    const raw = mmkv.getString('rq.cache');
    return raw ? JSON.parse(raw) : undefined;
  },
  removeClient: async () => mmkv.delete('rq.cache'),
};
```

- [ ] **Step 2: Wire in `_layout.tsx`** — replace `<QueryClientProvider>` with `<PersistQueryClientProvider>`:

```tsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { mmkvPersister } from '../lib/queryPersist';

<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister: mmkvPersister, maxAge: 1000 * 60 * 60 * 24 * 30 }}
>
  ...
</PersistQueryClientProvider>
```

- [ ] **Step 3: Write `apps/mobile/features/lessons/prefetch.ts`**

```ts
import { queryClient } from '../../lib/queryClient';
import { supabase } from '../../lib/supabase';

export async function prefetchCourse(courseId: string): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('day_number');
      return data ?? [];
    },
  });
  const lessons = queryClient.getQueryData<any[]>(['lessons', courseId]) ?? [];
  await Promise.all(lessons.map((l) =>
    queryClient.prefetchQuery({
      queryKey: ['lesson', l.id],
      queryFn: async () => {
        const { data } = await supabase.from('lessons').select('*, quizzes(id, quiz_questions(*, quiz_options(*)))').eq('id', l.id).single();
        return data;
      },
    })
  ));
}
```

Call `prefetchCourse(course.id)` once on Today screen mount.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile
git commit -m "feat(offline): TanStack Query persist to MMKV + lesson prefetch"
```

---

### Task 11.2: Offline outbox for quiz submissions

**Files:**
- Create: `apps/mobile/features/quiz/outbox.ts`
- Modify: `apps/mobile/features/quiz/quizQuery.ts` (route writes through outbox)

- [ ] **Step 1: Write `apps/mobile/features/quiz/outbox.ts`**

```ts
import NetInfo from '@react-native-community/netinfo';
import { mmkv } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';

const KEY = 'outbox.progress.v1';

type Pending = { lessonId: string; score: number; ts: string };

function read(): Pending[] {
  const raw = mmkv.getString(KEY);
  return raw ? JSON.parse(raw) : [];
}
function write(items: Pending[]) {
  mmkv.set(KEY, JSON.stringify(items));
}

export function enqueueProgress(item: Pending) {
  write([...read(), item]);
}

export async function flushOutbox(): Promise<void> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) return;
  const items = read();
  if (items.length === 0) return;
  const remaining: Pending[] = [];
  for (const it of items) {
    const { error } = await supabase.from('user_progress').upsert({
      user_id: userId, lesson_id: it.lessonId,
      completed_at: it.ts, score: it.score, attempts: 1,
    }, { onConflict: 'user_id,lesson_id' });
    if (error) remaining.push(it);
  }
  write(remaining);
}

export function startOutboxListener() {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) flushOutbox();
  });
}
```

- [ ] **Step 2: Add `@react-native-community/netinfo`**

```bash
pnpm --filter @kitup/mobile add @react-native-community/netinfo
```

- [ ] **Step 3: In `useSubmitProgress`** — wrap the supabase call so failures push to outbox:

```ts
import { enqueueProgress } from './outbox';

mutationFn: async (input) => {
  if (!userId) throw new Error('not authenticated');
  const item = { lessonId: input.lessonId, score: input.score, ts: new Date().toISOString() };
  const { error } = await supabase.from('user_progress').upsert({
    user_id: userId, lesson_id: item.lessonId,
    completed_at: item.ts, score: item.score, attempts: 1,
  }, { onConflict: 'user_id,lesson_id' });
  if (error) enqueueProgress(item);
},
```

- [ ] **Step 4: In `_layout.tsx`** call `startOutboxListener()` once on mount (return cleanup).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(offline): outbox for quiz progress with NetInfo flush"
```

---

### Task 11.3: Realtime subscriptions for content + config

**Files:**
- Create: `apps/mobile/features/realtime/subscribe.ts`
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Write `apps/mobile/features/realtime/subscribe.ts`**

```ts
import { supabase } from '../../lib/supabase';
import { queryClient } from '../../lib/queryClient';

const TABLES = ['courses', 'lessons', 'quizzes', 'quiz_questions', 'quiz_options', 'app_config'] as const;

export function subscribeContent(): () => void {
  const channels = TABLES.map((table) =>
    supabase
      .channel(`rt:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        if (table === 'courses') queryClient.invalidateQueries({ queryKey: ['course'] });
        if (table === 'lessons') queryClient.invalidateQueries({ queryKey: ['lessons'] });
        if (['quizzes', 'quiz_questions', 'quiz_options'].includes(table))
          queryClient.invalidateQueries({ queryKey: ['quiz'] });
        if (table === 'app_config') queryClient.invalidateQueries({ queryKey: ['app_config'] });
      })
      .subscribe(),
  );
  return () => channels.forEach((c) => supabase.removeChannel(c));
}
```

- [ ] **Step 2: Hook in `_layout.tsx`** — call `subscribeContent()` and store cleanup.

- [ ] **Step 3: Smoke test** — change a lesson title in admin → confirm mobile updates without restart.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile
git commit -m "feat(realtime): mobile subscriptions for content + config invalidation"
```

---

## Phase 12 — iOS home-screen widget

### Task 12.1: Widget target via expo-apple-targets

**Files:**
- Create: `apps/mobile/widgets/ios/today.swift`
- Create: `apps/mobile/widgets/ios/Info.plist`
- Modify: `apps/mobile/app.config.ts`

- [ ] **Step 1: Add config plugin**

```bash
pnpm --filter @kitup/mobile add @bacons/apple-targets
```

- [ ] **Step 2: Add to `app.config.ts` plugins**

```ts
plugins: [
  ...,
  ['@bacons/apple-targets', {
    appleTeamId: 'TEAMID', // fill from Apple Developer
    extensions: [
      { name: 'TodayWidget', bundleIdentifier: 'com.kitup.norse.TodayWidget',
        entitlements: { 'com.apple.security.application-groups': ['group.com.kitup.norse'] } },
    ],
  }],
],
ios: {
  ...,
  entitlements: { 'com.apple.security.application-groups': ['group.com.kitup.norse'] },
},
```

- [ ] **Step 3: Create `apps/mobile/widgets/ios/today.swift`**

```swift
import WidgetKit
import SwiftUI

struct TodayEntry: TimelineEntry {
  let date: Date
  let title: String
  let day: Int
  let totalDays: Int
}

struct TodayProvider: TimelineProvider {
  func placeholder(in context: Context) -> TodayEntry {
    TodayEntry(date: Date(), title: "Yggdrasil", day: 1, totalDays: 21)
  }
  func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
    completion(read())
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
    let entry = read()
    completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(60*60))))
  }
  private func read() -> TodayEntry {
    let suite = UserDefaults(suiteName: "group.com.kitup.norse")
    guard let data = suite?.data(forKey: "today.json"),
          let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      return TodayEntry(date: Date(), title: "kitUP Norse", day: 0, totalDays: 21)
    }
    return TodayEntry(
      date: Date(),
      title: (dict["title"] as? String) ?? "—",
      day: (dict["day"] as? Int) ?? 0,
      totalDays: (dict["totalDays"] as? Int) ?? 21
    )
  }
}

struct TodayWidgetView: View {
  let entry: TodayEntry
  var body: some View {
    Link(destination: URL(string: "kitup://lesson/today")!) {
      VStack(alignment: .leading, spacing: 6) {
        Text("DAY \(entry.day) / \(entry.totalDays)")
          .font(.caption2).foregroundColor(Color(red: 201/255, green: 169/255, blue: 110/255))
        Text(entry.title).font(.headline).foregroundColor(.white).lineLimit(2)
      }
      .padding()
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .background(Color(red: 11/255, green: 14/255, blue: 20/255))
    }
  }
}

@main
struct TodayWidget: Widget {
  let kind: String = "TodayWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: TodayProvider()) { entry in
      TodayWidgetView(entry: entry)
    }
    .configurationDisplayName("Today's Norse Lesson")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
```

- [ ] **Step 4: Write to App Group from RN**

```bash
pnpm --filter @kitup/mobile add expo-shared-defaults  # or use react-native-userdefaults-ios alternative
```

If no maintained Expo module exists for App Group writes, fall back to a tiny native module or use `react-native-userdefaults-ios` via dev-client. Document the chosen approach in the README.

`apps/mobile/features/widget/sync.ts`:
```ts
import { setItem } from 'expo-shared-defaults';

export async function syncTodayWidget(args: { title: string; day: number; totalDays: number }) {
  await setItem('group.com.kitup.norse', 'today.json', JSON.stringify(args));
}
```

Call from Today screen after `useActiveCourse`/`useLessons` resolve.

- [ ] **Step 5: Run prebuild + iOS build**

```bash
pnpm --filter @kitup/mobile expo prebuild --platform ios --clean
pnpm --filter @kitup/mobile ios
```

- [ ] **Step 6: Install widget on simulator home screen, verify content + tap deep-link.**

- [ ] **Step 7: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(widget): iOS today's lesson home-screen widget"
```

---

## Phase 13 — Observability + CI hardening

### Task 13.1: Sentry mobile + admin

**Files:**
- Modify: `apps/mobile/app.config.ts` (sentry-expo plugin)
- Create: `apps/mobile/lib/sentry.ts`
- Modify: `apps/admin/src/instrumentation.ts`
- Create: `apps/admin/sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

- [ ] **Step 1: Mobile**

```bash
pnpm --filter @kitup/mobile add @sentry/react-native
```

`apps/mobile/lib/sentry.ts`:
```ts
import * as Sentry from '@sentry/react-native';

export function initSentry() {
  if (!process.env.SENTRY_DSN_MOBILE) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN_MOBILE,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0.2,
  });
}
```

Call `initSentry()` in `_layout.tsx` before any other code. Add `process.env.SENTRY_DSN_MOBILE` to `extra` in `app.config.ts`.

- [ ] **Step 2: Admin**

```bash
pnpm --filter @kitup/admin add @sentry/nextjs
pnpm --filter @kitup/admin exec npx @sentry/wizard@latest -i nextjs --skip-connect
```

Accept defaults; configure DSN in `.env.local`.

- [ ] **Step 3: Verify a thrown test error reaches Sentry projects (mobile + admin).**

- [ ] **Step 4: Commit**

```bash
git add apps/ pnpm-lock.yaml
git commit -m "feat(observability): sentry mobile + admin"
```

---

### Task 13.2: PostHog events

**Files:**
- Create: `apps/mobile/lib/analytics.ts`
- Calls scattered: `lessonCompleted`, `quizAnswered`, `streakMilestone`, `aiCourseGenerated`, `translationMissing`

- [ ] **Step 1: Mobile**

```bash
pnpm --filter @kitup/mobile add posthog-react-native
```

`apps/mobile/lib/analytics.ts`:
```ts
import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const apiKey = (Constants.expoConfig?.extra as any)?.POSTHOG_API_KEY;
const host = (Constants.expoConfig?.extra as any)?.POSTHOG_HOST ?? 'https://app.posthog.com';

export const posthog = apiKey ? new PostHog(apiKey, { host }) : null;

export const track = (event: string, props?: Record<string, unknown>) => {
  posthog?.capture(event, props);
};
```

Add to `extra` in `app.config.ts`. Call:
- `track('lesson_completed', { lessonId, score })` in `useSubmitProgress.onSuccess`.
- `track('quiz_answered', { questionId, correct })` in quiz screen.
- `track('streak_milestone', { streak })` when 7/21/30 etc.
- `track('translation_missing', { key, locale })` from `i18nCache` when source==='missing' (add a hook).

Admin: add `posthog-js` similarly.

- [ ] **Step 2: Commit**

```bash
git add apps/ pnpm-lock.yaml
git commit -m "feat(analytics): posthog event tracking"
```

---

### Task 13.3: Husky pre-commit + CI hardening

**Files:**
- Create: `.husky/pre-commit`
- Modify: `package.json` (lint-staged)

- [ ] **Step 1: Add deps + init**

```bash
pnpm add -D -w husky lint-staged
pnpm exec husky init
```

- [ ] **Step 2: Replace `.husky/pre-commit`**

```sh
pnpm exec lint-staged
pnpm typecheck
```

- [ ] **Step 3: Add to root `package.json`**

```json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": ["eslint --max-warnings 0", "prettier --write"]
}
```

- [ ] **Step 4: Update `.github/workflows/ci.yml`** — already has lint/typecheck/test; add an `expo-prebuild` job:

```yaml
  expo-check:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @kitup/mobile exec expo prebuild --no-install --platform android
```

- [ ] **Step 5: Commit**

```bash
git add .husky package.json pnpm-lock.yaml .github/workflows
git commit -m "chore(ci): husky pre-commit + expo prebuild smoke"
```

---

## Phase 14 — Demo prep

### Task 14.1: Seed full 21-day Norse Mythology course via the AI pipeline

**Files:**
- Create: `scripts/seed-norse.ts`
- Create: `scripts/package.json`

- [ ] **Step 1: Write `scripts/package.json`**

```json
{
  "name": "@kitup/scripts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "seed:norse": "tsx seed-norse.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.46.1"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: Write `scripts/seed-norse.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = process.env.SEED_ADMIN_EMAIL!;
const adminPassword = process.env.SEED_ADMIN_PASSWORD!;

if (!url || !serviceKey || !adminEmail || !adminPassword) {
  console.error('Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD');
  process.exit(1);
}

const admin = createClient(url, serviceKey);

async function getAdminAccessToken(): Promise<string> {
  // Use a sign-in flow to obtain an access token whose JWT carries the admin role.
  const { data, error } = await admin.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
  if (error || !data.session) throw new Error(error?.message ?? 'admin sign-in failed');
  return data.session.access_token;
}

async function startGeneration(token: string): Promise<string> {
  const res = await fetch(`${url}/functions/v1/generate-course`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      topic: 'Norse Mythology',
      difficulty: 'beginner',
      dayCount: 21,
      locale: 'tr',
    }),
  });
  if (!res.ok) throw new Error(`generate-course failed: ${res.status} ${await res.text()}`);
  return (await res.json() as { jobId: string }).jobId;
}

async function waitForJob(jobId: string): Promise<string> {
  while (true) {
    const { data } = await admin.from('generation_jobs').select('*').eq('id', jobId).single();
    if (!data) throw new Error('job vanished');
    if (data.status === 'done') return data.output_ref as string;
    if (data.status === 'failed') throw new Error(`job failed: ${data.error_msg}`);
    process.stdout.write(`. ${data.status}\n`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function publishCourse(courseId: string) {
  const { error } = await admin.from('courses').update({ status: 'published' }).eq('id', courseId);
  if (error) throw error;
}

async function translateToEn(token: string) {
  const res = await fetch(`${url}/functions/v1/translate-content`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ sourceLocale: 'tr', targetLocale: 'en', batchSize: 500 }),
  });
  if (!res.ok) throw new Error(`translate-content failed: ${await res.text()}`);
  console.log('translate result:', await res.json());
}

async function main() {
  const token = await getAdminAccessToken();
  console.log('starting generation…');
  const jobId = await startGeneration(token);
  console.log('jobId:', jobId);
  const courseId = await waitForJob(jobId);
  console.log('courseId:', courseId);
  await publishCourse(courseId);
  console.log('published. translating to EN…');
  await translateToEn(token);
  console.log('done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run** the script with admin credentials. Inspect the result in the admin UI.

- [ ] **Step 3: Hand-edit any awkward sentences**, attach hero images via Storage URLs (free assets from Wikimedia Commons / Unsplash with proper attribution).

- [ ] **Step 4: Commit (script only — generated content is in DB, not git)**

```bash
git add scripts
git commit -m "chore(seed): norse mythology 21-day seeding script"
```

---

### Task 14.2: Visual polish pass

- [ ] **Step 1: Hero image curation** — pick atmospheric Norse art for cover + at least 5 lessons.
- [ ] **Step 2: Loading skeletons** — replace `ActivityIndicator` with simple skeleton blocks in Today / Lesson / Quiz.
- [ ] **Step 3: Animations** — add a `react-native-reanimated` fade-in on day-complete score.
- [ ] **Step 4: Empty-state copy** — "Loki has hidden today's lesson…" if course empty (translation key).
- [ ] **Step 5: Commit**

```bash
git add apps/mobile
git commit -m "polish: skeletons, animations, atmospheric empty states"
```

---

### Task 14.3: README + run instructions + demo recording checklist

**Files:**
- Modify: `README.md`
- Create: `docs/SETUP.md`
- Create: `docs/DEMO_CHECKLIST.md`

- [ ] **Step 1: Expand `README.md`** with: project overview, screenshots, architecture diagram (link to spec), quick start (clone, install, env, supabase link, db reset, edge function deploy, mobile run, admin run), tech stack badges.

- [ ] **Step 2: Write `docs/SETUP.md`** — full setup with Apple Developer notes (Services ID, Secret Key), Gemini API key, Supabase project provisioning, env var reference.

- [ ] **Step 3: Write `docs/DEMO_CHECKLIST.md`** — manual smoke test before recording: anon login OK, onboarding TR→EN switch OK, lesson + quiz happy path OK, admin login OK, generate Greek mythology 5-day OK, realtime sync visible OK, widget visible OK, profile Apple sign-in OK on simulator.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/
git commit -m "docs: README, setup guide, demo recording checklist"
```

---

### Task 14.4: Record + edit demo video (3–5 min, Loom)

- [ ] Record per `docs/DEMO_CHECKLIST.md`. Open with the runic kitUP logo / dark theme. Narrate in TR (or EN — pick one). Add the Loom link to the README.

---

## Done

Every required case-study item and both bonuses are now implemented, tested where it matters, and demo-ready.
