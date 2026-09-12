import { NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const db = await serverDb();
  if (db && code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", url.origin));
  }
  return NextResponse.redirect(new URL("/login?expired=1", url.origin));
}
