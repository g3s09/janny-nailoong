"use client";

// Forget local private drafts and this device's push subscription on logout.
export async function clearDeviceSession(profileId: string) {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`janny-draft:${profileId}:`))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    /* Storage may be unavailable. */
  }
  try {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager?.getSubscription();
    if (!subscription) return;
    // Unsubscribe locally even if the server cannot be reached.
    await subscription.unsubscribe();
    await fetch("/api/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* Closing the session must remain possible offline. */
  }
}
