import { createBrowserClient } from "@supabase/ssr";
export const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
export const previewAllowed =
  process.env.NODE_ENV === "development" && !configured;
let client: ReturnType<typeof createBrowserClient> | undefined;
export function browserDb() {
  if (!configured)
    throw new Error(
      "Falta conectar Supabase. Los mensajes aún no pueden enviarse.",
    );
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}
