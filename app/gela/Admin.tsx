"use client";
import { sectionMotion } from "@/lib/motion";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { WorldProvider, useWorld } from "@/lib/world-store";
import type { Profile } from "@/lib/types";
import { browserDb } from "@/lib/supabase/client";
import MailPanel from "../components/MailPanel";
import MemoriesPanel from "../components/MemoriesPanel";
import ContentManager from "./ContentManager";
import PersonalTouches from "./PersonalTouches";
import PushSettings from "../components/PushSettings";
import { clearDeviceSession } from "@/lib/device-session";
function Panel() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const { data, error, refresh, toast, notify, profile, loading, dataReady } =
    useWorld();
  const [tab, setTab] = useState("mail");
  const tabs = [
    { id: "mail", name: "Buzón" },
    { id: "memories", name: "Recuerdos" },
    { id: "open_when", name: "Ábrelo cuando…" },
    { id: "events", name: "Fechas y sorpresas" },
    { id: "phrases", name: "Voz de Nailoong" },
  ];
  return (
    <main className="admin-shell">
      <header>
        <div>
          <p className="eyebrow">EL OTRO LADO DEL RINCÓN</p>
          <h1>Con cariño, {profile.name}.</h1>
          <p>Aquí preparas las pequeñas cosas que llegarán hasta Janny.</p>
        </div>
        <button
          className="secondary"
          onClick={async () => {
            await clearDeviceSession(profile.id);
            const { error } = await browserDb().auth.signOut();
            if (error) {
              notify("No se pudo cerrar la sesión.");
              return;
            }
            router.replace("/login");
            router.refresh();
          }}
        >
          Cerrar sesión
        </button>
      </header>
      <Link className="secondary" href="/preview">
        Ver el rincón desde la bienvenida →
      </Link>
      {!data.profiles.some((p) => p.role === "janny") && (
        <p className="setup-notice">
          Falta invitar a Janny y asociar su perfil antes de enviarle contenido.
        </p>
      )}
      <nav className="admin-tabs" aria-label="Herramientas de Gela">
        {tabs.map((t) => (
          <button
            key={t.id}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.name}
          </button>
        ))}
      </nav>
      <PersonalTouches onChoose={setTab} />
      {error && (
        <p className="error-text">
          {error} <button onClick={() => void refresh()}>Reintentar</button>
        </p>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          className="admin-paper"
          data-section={tab}
          key={tab}
          {...sectionMotion(tab, reduced)}
        >
          {loading || !dataReady ? (
            <p role="status">Abriendo tu panel…</p>
          ) : tab === "mail" ? (
            <MailPanel admin />
          ) : tab === "memories" ? (
            <MemoriesPanel admin />
          ) : (
            <ContentManager
              key={tab}
              table={tab as "open_when" | "events" | "phrases"}
            />
          )}
        </motion.section>
      </AnimatePresence>
      <details className="admin-notifications">
        <summary>Avisos de nuevas cartas</summary>
        <PushSettings />
      </details>
      <Link className="text-button" href="/password">
        Cambiar mi contraseña
      </Link>
      <p className="privacy-note">
        El diario y los estados de ánimo de Janny permanecen privados.
      </p>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
export default function Admin({ profile }: { profile: Profile }) {
  return (
    <WorldProvider profile={profile} preview={false}>
      <Panel />
    </WorldProvider>
  );
}
