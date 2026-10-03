"use client";
import { sectionMotion } from "@/lib/motion";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Mail,
  Camera,
  Heart,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import AppNavigation from "../components/AppNavigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { WorldProvider, useWorld } from "@/lib/world-store";
import type { Profile } from "@/lib/types";
import { browserDb } from "@/lib/supabase/client";
import MailPanel from "../components/MailPanel";
import UnreadBadge from "../components/UnreadBadge";
import MemoriesPanel from "../components/MemoriesPanel";
import ContentManager from "./ContentManager";
import PushSettings from "../components/PushSettings";
import AppearanceSettings from "../components/AppearanceSettings";
import { clearDeviceSession } from "@/lib/device-session";
function Panel() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const {
    data,
    error,
    refresh,
    toast,
    notify,
    profile,
    loading,
    dataReady,
    conversation,
  } = useWorld();
  const [tab, setTab] = useState("home");
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("open") !== "mail") return;
    const timer = setTimeout(() => {
      setTab("mail");
      url.searchParams.delete("open");
      window.history.replaceState(window.history.state, "", url);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const actions = [
    { id: "mail", name: "Escribirle", icon: Mail },
    { id: "memories", name: "Un recuerdo", icon: Camera },
    { id: "open_when", name: "Una carta", icon: Heart },
    { id: "events", name: "Una sorpresa", icon: CalendarDays },
  ];
  const latestMemory = [...data.memories].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];
  const letters = data.open_when.slice(0, 3);
  return (
    <main className="admin-shell">
      <header>
        <div>
          <p className="eyebrow">GELA & JANNY</p>
          <h1>
            Para Janny
            <span className="heading-heart" aria-hidden="true">
              {" "}
              ♡
            </span>
          </h1>
        </div>
        <Link className="text-button" href="/preview">
          Su rincón <ArrowUpRight size={16} />
        </Link>
      </header>
      {dataReady &&
        !loading &&
        !data.profiles.some((p) => p.role === "janny") && (
          <p className="setup-notice">
            Falta invitar a Janny y asociar su perfil antes de enviarle
            contenido.
          </p>
        )}
      <AppNavigation
        active={tab}
        unread={conversation.unreadCount}
        onChoose={setTab}
      />
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
          ) : tab === "home" ? (
            <div className="gela-home">
              <div className="gela-actions">
                {actions.map(({ id, name, icon: Icon }) => (
                  <button key={id} onClick={() => setTab(id)}>
                    <span className="action-icon">
                      <Icon size={25} />
                      {id === "mail" && (
                        <UnreadBadge count={conversation.unreadCount} />
                      )}
                    </span>
                    <strong>{name}</strong>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                ))}
              </div>
              {conversation.unreadCount > 0 && (
                <button className="gela-unread" onClick={() => setTab("mail")}>
                  <Mail size={21} />
                  <span>
                    {conversation.unreadCount === 1
                      ? "Janny te escribió"
                      : "Tienes mensajes de Janny"}
                  </span>
                  <UnreadBadge count={conversation.unreadCount} />
                  <ArrowUpRight size={18} />
                </button>
              )}
              {(latestMemory || letters.length > 0) && (
                <div className="gela-shelf">
                  {latestMemory && (
                    <button
                      className="gela-memory"
                      onClick={() => setTab("memories")}
                    >
                      <Camera size={23} />
                      <small>NUESTRO ÚLTIMO RECUERDO</small>
                      <h2>{latestMemory.title}</h2>
                      <ArrowUpRight size={18} />
                    </button>
                  )}
                  {letters.length > 0 && (
                    <section className="gela-letters">
                      <h2>Mis cartas</h2>
                      {letters.map((letter) => (
                        <button
                          key={letter.id}
                          onClick={() => setTab("open_when")}
                        >
                          <Heart size={15} />
                          <span>{letter.title}</span>
                          <ArrowUpRight size={15} />
                        </button>
                      ))}
                    </section>
                  )}
                </div>
              )}
              <button className="text-button" onClick={() => setTab("phrases")}>
                <Sparkles size={16} />
                Nailoong
              </button>
            </div>
          ) : tab === "settings" ? (
            <div className="gela-settings">
              <h2>Ajustes</h2>
              <AppearanceSettings sounds />
              <PushSettings />
              <Link className="secondary" href="/password">
                Cambiar contraseña
              </Link>
              <button
                className="text-button"
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
            </div>
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
