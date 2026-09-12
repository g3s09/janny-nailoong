import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configured } from "./client";
export async function serverDb() {
  if (!configured) return null;
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server Component: the proxy refreshes cookies. */
          }
        },
      },
    },
  );
}
