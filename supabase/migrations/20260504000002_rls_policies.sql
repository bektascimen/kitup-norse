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
returns boolean language sql stable set search_path = public as $$
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

-- Lock down the trigger function: it is invoked by the auth.users trigger only,
-- never via PostgREST. Revoke EXECUTE so anon/authenticated cannot call it as RPC.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- Trigger: bump updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
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
