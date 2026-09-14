// Vercel's Supabase integration uses PUBLISHABLE_KEY; older setups use ANON_KEY.
// Both are public client keys. A secret/service-role key must never be used here.
export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const configured = Boolean(supabaseUrl && supabasePublicKey);
