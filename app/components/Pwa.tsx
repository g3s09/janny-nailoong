"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Dialog from "./Dialog";
import { AnimatePresence } from "motion/react";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
export default function Pwa() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [help, setHelp] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const update = () =>
      setStandalone(
        display.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    queueMicrotask(update);
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const installed = () => {
      setStandalone(true);
      setPrompt(null);
      setHelp(false);
    };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", installed);
    display.addEventListener("change", update);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .catch(() => {
          /* Installation remains optional. */
        });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", installed);
      display.removeEventListener("change", update);
    };
  }, []);
  async function install() {
    if (!prompt) {
      setHelp(true);
      return;
    }
    setBusy(true);
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === "accepted") setStandalone(true);
    } catch {
      setHelp(true);
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  }
  if (standalone) return null;
  return (
    <>
      <button
        type="button"
        className="install-app"
        onClick={install}
        disabled={busy}
        aria-label="Instalar Mi rincón como aplicación"
      >
        <Download size={16} aria-hidden="true" />{" "}
        {busy ? "Abriendo…" : "Instalar app"}
      </button>
      <AnimatePresence>
        {help && (
          <Dialog
            title="Tu rincón, siempre cerquita"
            subtitle="Guárdalo en tu pantalla de inicio."
            onClose={() => setHelp(false)}
          >
            <div className="install-instructions">
              <p>
                <strong>iPhone o iPad:</strong> abre esta página en Safari, toca
                Compartir y elige «Agregar a pantalla de inicio».
              </p>
              <p>
                <strong>Android:</strong> abre el menú de Chrome y elige
                «Instalar aplicación» o «Agregar a pantalla de inicio».
              </p>
              <p>
                <strong>Computadora:</strong> en Edge o Chrome, busca el icono
                de instalación junto a la dirección, o la opción de instalar en
                el menú del navegador.
              </p>
              <p className="privacy-note">
                Necesitas conexión para recibir y enviar mensajes.
              </p>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
