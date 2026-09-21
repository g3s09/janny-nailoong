"use client";
import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { WorldProvider, useWorld } from "@/lib/world-store";
import type { Profile } from "@/lib/types";
import WelcomeSequence from "./WelcomeSequence";
import HomeScene from "./HomeScene";
import Panels from "./Panels";
function ExperienceBody({ freshStart = false }: { freshStart?: boolean }) {
  const { profile, setPanel, toast, preview } = useWorld();
  const [name, setName] = useState("");
  const [intro, setIntro] = useState<boolean | null>(null);
  useEffect(() => {
    const task = window.setTimeout(() => {
      try {
        const saved = freshStart
          ? null
          : localStorage.getItem(`janny-intro-v2:${profile.id}`);
        setName(saved || "");
        setIntro(!saved);
      } catch {
        setIntro(true);
      }
    }, 0);
    return () => clearTimeout(task);
  }, [profile.id, freshStart]);
  function complete(value: string) {
    setName(value);
    try {
      if (!freshStart)
        localStorage.setItem(`janny-intro-v2:${profile.id}`, value);
    } catch {}
    setIntro(false);
    setPanel("letter");
  }
  if (intro === null)
    return <main className="loading-screen">Encendiendo una lucecita…</main>;
  return (
    <>
      {intro ? (
        <WelcomeSequence initialName={name} onComplete={complete} />
      ) : (
        <>
          <HomeScene
            name={name}
            onRepeat={() => {
              setPanel(null);
              setName("");
              localStorage.removeItem(`janny-intro-v2:${profile.id}`);
              setIntro(true);
            }}
          />
          <Panels
            onRepeat={() => {
              setPanel(null);
              setName("");
              localStorage.removeItem(`janny-intro-v2:${profile.id}`);
              setIntro(true);
            }}
          />
        </>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {preview && (
        <div className="preview-label">
          Vista local · los mensajes necesitan conectar Supabase
        </div>
      )}
    </>
  );
}
export default function Experience({
  profile,
  preview,
  freshStart = false,
}: {
  profile: Profile;
  preview: boolean;
  freshStart?: boolean;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <WorldProvider
        profile={profile}
        preview={preview}
        ephemeral={freshStart && preview}
      >
        <ExperienceBody freshStart={freshStart} />
      </WorldProvider>
    </MotionConfig>
  );
}
