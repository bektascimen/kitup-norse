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
  requested_by uuid references auth.users(id) on delete set null,
  type job_type not null,
  input_payload jsonb not null,
  status job_status not null default 'pending',
  output_ref uuid,
  error_msg text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index generation_jobs_status_idx on generation_jobs(status, created_at);
