import "server-only";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { supabaseUrl } from "./supabase/config";

export function pushReady() {
  return Boolean(
    supabaseUrl &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT,
  );
}
export function pushDb() {
  if (!pushReady()) throw new Error("Push not configured");
  return createClient(supabaseUrl!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function validSubscription(
  value: unknown,
): value is { endpoint: string; keys: { p256dh: string; auth: string } } {
  if (!value || typeof value !== "object") return false;
  const v = value as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  if (typeof v.endpoint !== "string" || v.endpoint.length > 2048) return false;
  try {
    const url = new URL(v.endpoint);
    const hosts = [
      "fcm.googleapis.com",
      "updates.push.services.mozilla.com",
      "web.push.apple.com",
      "wns.windows.com",
      "notify.windows.com",
    ];
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !hosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
    )
      return false;
  } catch {
    return false;
  }
  return (
    typeof v.keys?.p256dh === "string" &&
    /^[A-Za-z0-9_-]{87,88}$/.test(v.keys.p256dh) &&
    typeof v.keys.auth === "string" &&
    /^[A-Za-z0-9_-]{22,24}$/.test(v.keys.auth)
  );
}
export async function dispatchPush(sender?: string) {
  const db = pushDb();
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  const { data, error } = await db.rpc("claim_push_jobs", {
    sender_filter: sender ?? null,
  });
  if (error) throw error;
  let delivered = 0;
  for (const job of data ?? []) {
    const subscription = {
      endpoint: job.endpoint,
      keys: { p256dh: job.p256dh, auth: job.auth },
    };
    try {
      if (!validSubscription(subscription))
        throw Object.assign(new Error("Invalid endpoint"), { statusCode: 410 });
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: "Tu rincón",
          body: "Tienes una carta nueva. Entra a tu rincón para leerla.",
          tag: job.message_id,
        }),
        { TTL: 3600, timeout: 8000 },
      );
      await db
        .from("push_jobs")
        .delete()
        .eq("id", job.id)
        .eq("claim_token", job.claim_token);
      delivered++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410)
        await db
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", job.endpoint);
      else
        await db
          .from("push_jobs")
          .update({
            available_at: new Date(
              Date.now() + 60000 * Math.min(job.attempts, 5),
            ).toISOString(),
          })
          .eq("id", job.id)
          .eq("claim_token", job.claim_token);
    }
  }
  return delivered;
}
