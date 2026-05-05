import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (set: CookieToSet[]) =>
          set.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = req.nextUrl.pathname.startsWith('/login');
  const isAuthCallback = req.nextUrl.pathname.startsWith('/auth/callback');

  if (!user && !isLogin && !isAuthCallback) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (user) {
    const role = (user.app_metadata as { role?: string } | undefined)?.role;
    if (role !== 'admin' && !isLogin) {
      return NextResponse.redirect(new URL('/login?error=not_admin', req.url));
    }
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
