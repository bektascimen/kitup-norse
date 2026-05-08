import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Magic-link callback. Supabase redirects here with `?code=<pkce>`;
 * we exchange the code for a session (sets the SSR cookies via the
 * server client), then bounce to the requested `next` path or home.
 *
 * The middleware (`src/middleware.ts`) explicitly whitelists this
 * path so an unauthenticated user can reach it — the exchange itself
 * is what authenticates them.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url.origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
