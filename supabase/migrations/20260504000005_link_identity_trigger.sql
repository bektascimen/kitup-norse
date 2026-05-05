-- When a user gains an identity (apple/email/etc.), mark their profile as non-anonymous.
create or replace function public.handle_identity_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set anonymous = false where id = new.user_id;
  return new;
end;
$$;

revoke execute on function public.handle_identity_link() from public, anon, authenticated;

drop trigger if exists on_identity_added on auth.identities;
create trigger on_identity_added
  after insert on auth.identities
  for each row execute function public.handle_identity_link();
