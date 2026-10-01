"use client";
import { useEffect, useState } from "react";
import { useWorld } from "@/lib/world-store";
import { useSubmitLock } from "@/lib/use-submit-lock";
export default function PushSettings() {
  const { preview } = useWorld();
  const [state, setState] = useState("Comprobando disponibilidad…");
  const [key, setKey] = useState<string | null>(null);
  const { busy, acquire, release } = useSubmitLock();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let live = true;
    async function check() {
      if (preview) {
        if (live)
          setState(
            "Los avisos se activan desde tu cuenta real, no desde esta prueba.",
          );
        return;
      }
      if (
        !("PushManager" in window) ||
        !("serviceWorker" in navigator) ||
        !("Notification" in window)
      ) {
        if (live)
          setState(
            "En iPhone, instala primero el rincón desde Safari. Si tu navegador no admite avisos, puedes seguir usando el buzón.",
          );
        return;
      }
      try {
        const response = await fetch("/api/push");
        if (!response.ok) throw new Error();
        const config = await response.json();
        if (live) {
          setKey(config.ready ? config.publicKey : null);
          setState(
            config.ready
              ? "Puedes recibir una señal cuando llegue una carta."
              : "Los avisos fuera de la app todavía no están disponibles.",
          );
        }
        if (config.ready && Notification.permission === "granted") {
          const registration = await navigator.serviceWorker.getRegistration();
          const subscription =
            await registration?.pushManager.getSubscription();
          if (subscription) {
            const saved = await fetch("/api/push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(subscription),
            });
            if (!saved.ok) throw new Error();
            if (live) {
              setEnabled(true);
              setState("Recibirás avisos de mensajes en este dispositivo.");
            }
          }
        }
        if (config.ready && Notification.permission === "denied" && live)
          setState(
            "Los avisos están bloqueados. Permítelos en los ajustes del navegador para este sitio.",
          );
      } catch {
        if (live)
          setState(
            "No pudimos comprobar los avisos. Vuelve a abrir esta sección.",
          );
      }
    }
    void check();
    return () => {
      live = false;
    };
  }, [preview]);
  async function enable() {
    if (!key || !acquire()) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(
          "Sin permiso para avisos. Puedes cambiarlo en los ajustes de este sitio.",
        );
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const decoded = atob(key.replace(/-/g, "+").replace(/_/g, "/"));
      const bytes = Uint8Array.from(decoded, (c) => c.charCodeAt(0));
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bytes,
        }));
      const response = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) throw new Error();
      setEnabled(true);
      setState("Listo, los avisos están activados en este dispositivo.");
    } catch {
      setState(
        "No se pudieron activar los avisos. Puedes volver a intentarlo.",
      );
    } finally {
      release();
    }
  }
  async function disable() {
    if (!acquire()) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) throw new Error();
        await subscription.unsubscribe();
      }
      setEnabled(false);
      setState("Avisos desactivados en este dispositivo.");
    } catch {
      setState(
        "No pudimos desactivar los avisos. Inténtalo de nuevo con conexión.",
      );
    } finally {
      release();
    }
  }
  return (
    <section className="push-settings">
      <h3>Una señal cuando llegue una carta</h3>

      <p role="status">{state}</p>
      {key && (
        <div className="button-row">
          <button
            type="button"
            className="secondary"
            disabled={busy || enabled}
            onClick={enable}
          >
            {enabled ? "Avisos activados" : "Activar en este dispositivo"}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy || !enabled}
            onClick={disable}
          >
            Desactivar en este dispositivo
          </button>
        </div>
      )}
    </section>
  );
}
