"use client";
import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { WorldProvider, useWorld } from "@/lib/world-store";
import type { Profile } from "@/lib/types";
import WelcomeSequence from "./WelcomeSequence";
import HomeScene from "./HomeScene";
import Panels from "./Panels";
function ExperienceBody() {
  const { profile, setPanel, toast, preview } = useWorld();
  const [name, setName] = useState(profile.name);
  const [intro, setIntro] = useState<boolean | null>(null);
  useEffect(() => {
    const task = window.setTimeout(() => {
      try {
        setName(localStorage.getItem("nailoong-user-name") || profile.name);
        setIntro(localStorage.getItem("nailoong-welcome-seen") !== "true");
      } catch {
        setIntro(true);
      }
    }, 0);
    return () => clearTimeout(task);
  }, [profile.name]);
  function complete(value: string) {
    setName(value);
    try {
      localStorage.setItem("nailoong-user-name", value);
      localStorage.setItem("nailoong-welcome-seen", "true");
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
              setIntro(true);
            }}
          />
          <Panels
            onRepeat={() => {
              setPanel(null);
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
}: {
  profile: Profile;
  preview: boolean;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <WorldProvider profile={profile} preview={preview}>
        <ExperienceBody />
      </WorldProvider>
    </MotionConfig>
  );
}
