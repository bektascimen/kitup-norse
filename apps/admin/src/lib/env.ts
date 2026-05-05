function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
  supabasePublishableKey: required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
};
