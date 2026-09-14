import { createBrowserClient } from "@supabase/ssr";
import { configured, supabaseUrl, supabasePublicKey } from "./config";
export { configured } from "./config";
export const previewAllowed =
  process.env.NODE_ENV === "development" && !configured;
let client: ReturnType<typeof createBrowserClient> | undefined;
export function browserDb() {
  if (!configured)
    throw new Error(
      "Falta conectar Supabase. Los mensajes aún no pueden enviarse.",
    );
  client ??= createBrowserClient(supabaseUrl!, supabasePublicKey!);
  return client;
}
