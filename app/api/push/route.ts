import { NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase/server";
import { pushReady, validSubscription } from "@/lib/push-server";
export const dynamic = "force-dynamic";
async function member() {
  const db = await serverDb();
  if (!db) return null;
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  return data ? { db, id: user.id } : null;
}
export async function GET() {
  const user = await member();
  if (!user)
    return NextResponse.json({ error: "Acceso privado" }, { status: 401 });
  const { error } = await user.db
    .from("push_subscriptions")
    .select("endpoint")
    .limit(1);
  return NextResponse.json(
    {
      ready: pushReady() && !error,
      publicKey: pushReady() && !error ? process.env.VAPID_PUBLIC_KEY : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return new Response(null, { status: 403 });
  const user = await member();
  if (!user || !pushReady()) return new Response(null, { status: 403 });
  let subscription;
  try {
    subscription = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!validSubscription(subscription))
    return NextResponse.json(
      { error: "Suscripción no válida" },
      { status: 400 },
    );
  const { error } = await user.db
    .from("push_subscriptions")
    .upsert(
      {
        owner_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: "endpoint" },
    );
  return NextResponse.json({ ok: !error }, { status: error ? 400 : 200 });
}
export async function DELETE(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return new Response(null, { status: 403 });
  const user = await member();
  if (!user) return new Response(null, { status: 401 });
  let query = user.db
    .from("push_subscriptions")
    .delete()
    .eq("owner_id", user.id);
  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = await request.json().catch(() => null);
    if (typeof body?.endpoint !== "string")
      return new Response(null, { status: 400 });
    query = query.eq("endpoint", body.endpoint);
  }
  const { error } = await query;
  return NextResponse.json({ ok: !error }, { status: error ? 400 : 200 });
}
