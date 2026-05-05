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

-- Grant execute to authenticated/anon so the Edge Function can RPC it via the caller's JWT.
grant execute on function public.translations_missing_for(text, text, int) to anon, authenticated;
