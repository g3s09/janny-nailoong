import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { serverDb } from "@/lib/supabase/server";
import { dispatchPush, pushReady } from "@/lib/push-server";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!pushReady()) return NextResponse.json({ ready: false }, { status: 503 });
  const secret = process.env.PUSH_DISPATCH_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  const cron = Boolean(
    secret &&
    actual.length === expected.length &&
    timingSafeEqual(actual, expected),
  );
  let sender: string | undefined;
  if (!cron) {
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return new Response(null, { status: 403 });
    const db = await serverDb();
    const user = db ? (await db.auth.getUser()).data.user : null;
    if (!user) return new Response(null, { status: 401 });
    const profile = await db!
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    if (!profile.data) return new Response(null, { status: 403 });
    sender = user.id;
  }
  try {
    return NextResponse.json({ delivered: await dispatchPush(sender) });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron entregar los avisos" },
      { status: 503 },
    );
  }
}
