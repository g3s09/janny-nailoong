"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorldProvider, useWorld } from "@/lib/world-store";
import type { Profile } from "@/lib/types";
import { browserDb } from "@/lib/supabase/client";
import MailPanel from "../components/MailPanel";
import MemoriesPanel from "../components/MemoriesPanel";
import ContentManager from "./ContentManager";
function Panel() {
  const router = useRouter();
  const { data, error, refresh, toast, notify, profile } = useWorld();
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
      {error && (
        <p className="error-text">
          {error} <button onClick={() => void refresh()}>Reintentar</button>
        </p>
      )}
      <section className="admin-paper section-reveal" key={tab}>
        {tab === "mail" ? (
          <MailPanel admin />
        ) : tab === "memories" ? (
          <MemoriesPanel admin />
        ) : (
          <ContentManager
            key={tab}
            table={tab as "open_when" | "events" | "phrases"}
          />
        )}
      </section>
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
