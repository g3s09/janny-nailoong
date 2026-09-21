import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseUrl, supabasePublicKey } from "./lib/supabase/config";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseUrl || !supabasePublicKey) return response;
  const db = createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await db.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/", "/gela/:path*", "/preview", "/login", "/auth/:path*"],
};
