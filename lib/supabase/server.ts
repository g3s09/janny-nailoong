import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configured, supabaseUrl, supabasePublicKey } from "./config";
export async function serverDb() {
  if (!configured) return null;
  const jar = await cookies();
  return createServerClient(supabaseUrl!, supabasePublicKey!, {
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
  });
}
