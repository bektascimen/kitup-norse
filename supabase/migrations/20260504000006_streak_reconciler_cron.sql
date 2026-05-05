-- Reset current_streak to 0 for users whose last_active_date is older than yesterday.
-- SECURITY DEFINER means it runs with the function-owner's privileges (postgres),
-- bypassing RLS for this single, well-scoped maintenance task.
create or replace function public.reconcile_streaks()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  with bumped as (
    update user_streaks
       set current_streak = 0
     where current_streak > 0
       and (last_active_date is null or last_active_date < (current_date - interval '1 day'))
    returning user_id
  )
  select count(*) into v_count from bumped;
  return v_count;
end;
$$;

revoke execute on function public.reconcile_streaks() from public, anon, authenticated;
-- No grant needed — only the cron job (running as postgres) ever calls it.

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'streak-reconciler-nightly',
  '5 0 * * *',  -- 00:05 UTC daily
  $$ select public.reconcile_streaks(); $$
);
