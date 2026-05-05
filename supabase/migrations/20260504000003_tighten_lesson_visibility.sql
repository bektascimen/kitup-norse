-- Tighten visibility: lessons/quizzes/questions/options should only be readable
-- when their parent course is published, OR the caller is admin.

drop policy if exists "lessons readable by all" on lessons;
create policy "lessons readable" on lessons for select using (
  public.is_admin() or exists (
    select 1 from courses c where c.id = lessons.course_id and c.status = 'published'
  )
);

drop policy if exists "quizzes readable by all" on quizzes;
create policy "quizzes readable" on quizzes for select using (
  public.is_admin() or exists (
    select 1 from lessons l
    join courses c on c.id = l.course_id
    where l.id = quizzes.lesson_id and c.status = 'published'
  )
);

drop policy if exists "quiz_questions readable by all" on quiz_questions;
create policy "quiz_questions readable" on quiz_questions for select using (
  public.is_admin() or exists (
    select 1 from quizzes q
    join lessons l on l.id = q.lesson_id
    join courses c on c.id = l.course_id
    where q.id = quiz_questions.quiz_id and c.status = 'published'
  )
);

drop policy if exists "quiz_options readable by all" on quiz_options;
create policy "quiz_options readable" on quiz_options for select using (
  public.is_admin() or exists (
    select 1 from quiz_questions qq
    join quizzes q on q.id = qq.quiz_id
    join lessons l on l.id = q.lesson_id
    join courses c on c.id = l.course_id
    where qq.id = quiz_options.question_id and c.status = 'published'
  )
);

-- Translations are still public (only contain UI strings + lesson body text bound
-- by translation keys). Lesson body keys are namespaced like lesson.{slug}.day{N}.body
-- so anon clients reading the lesson body via translations still requires knowing the
-- key, which is gated by lessons SELECT above. Acceptable trade-off for backend-driven
-- i18n.
