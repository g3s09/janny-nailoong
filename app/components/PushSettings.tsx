"use client";
import { useEffect, useState } from "react";
import { useWorld } from "@/lib/world-store";
export default function PushSettings() {
  const { preview } = useWorld();
  const [state, setState] = useState("Comprobando disponibilidad…");
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
      if (!("PushManager" in window) || !("serviceWorker" in navigator)) {
        if (live)
          setState(
            "En iPhone, instala primero el rincón desde Safari. Si tu navegador no admite avisos, puedes seguir usando el buzón.",
          );
        return;
      }
      try {
        const response = await fetch("/api/push");
        const config = await response.json();
        if (live) {
          setKey(config.ready ? config.publicKey : null);
          setState(
            config.ready
              ? "Puedes recibir una señal cuando llegue una carta."
              : "Los avisos externos están pendientes de configuración del servidor.",
          );
        }
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
    if (!key) return;
    setBusy(true);
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
      setState(
        "Avisos activados en este dispositivo. El contenido de tus cartas permanece privado.",
      );
    } catch {
      setState(
        "No se pudieron activar los avisos. Puedes volver a intentarlo.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function disable() {
    setBusy(true);
    try {
      const response = await fetch("/api/push", { method: "DELETE" });
      if (!response.ok) throw new Error();
      const registration = await navigator.serviceWorker.getRegistration();
      await (await registration?.pushManager.getSubscription())?.unsubscribe();
      setState("Avisos desactivados para tu cuenta en todos sus dispositivos.");
    } catch {
      setState(
        "No pudimos desactivar los avisos. Inténtalo de nuevo con conexión.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="push-settings">
      <h3>Una señal cuando llegue una carta</h3>
      <p>El aviso no muestra nombres, texto ni archivos de la conversación.</p>
      <p role="status">{state}</p>
      {key && (
        <div className="button-row">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={enable}
          >
            Activar en este dispositivo
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={disable}
          >
            Desactivar mis avisos
          </button>
        </div>
      )}
    </section>
  );
}
