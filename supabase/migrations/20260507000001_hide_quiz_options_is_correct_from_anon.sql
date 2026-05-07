-- Don't let unauthenticated clients (raw publishable key, no JWT) read
-- quiz_options.is_correct. The mobile app always carries an anon-signed
-- JWT once bootstrapAuth runs, so the authenticated role keeps full
-- SELECT and the JS-side scoring continues to work. Anyone hitting the
-- REST API with just the publishable key sees the question shape but
-- not which option is the answer.
revoke select on public.quiz_options from anon;
grant  select (id, question_id, label_key, position) on public.quiz_options to anon;
-- authenticated already has full select via the original grant; no-op
-- for them. RLS policies (published-course-only) still apply on top.
