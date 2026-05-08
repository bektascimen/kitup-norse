/**
 * NEXT_PUBLIC_* env vars are inlined into the client bundle by Next.js
 * — but only when accessed via *literal* `process.env.FOO`. Dynamic
 * access (`process.env[name]`) is not statically analysable, so the
 * value comes through as `undefined` in the browser even when the var
 * is set on the server. Read each var literally below; the helper just
 * narrows the result to a non-empty string.
 */
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export const env = {
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
};
