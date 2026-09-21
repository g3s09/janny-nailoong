"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import Nailoong from "./Nailoong";
const lines = [
  "Este pequeño rincón es solo tuyo.",
  "Fue creado especialmente para ti.",
  "Aquí habrá recuerdos, pequeñas sorpresas…",
  "y alguien esperando conocerte.",
];
export default function WelcomeSequence({
  initialName,
  onComplete,
}: {
  initialName: string;
  onComplete: (name: string) => void;
}) {
  const [stage, setStage] = useState<"intro" | "hello" | "name" | "welcome">(
    "intro",
  );
  const [line, setLine] = useState(0);
  const [name, setName] = useState(initialName);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (stage !== "intro") return;
    const timer = setTimeout(() => {
      if (line < lines.length - 1) setLine((v) => v + 1);
      else setReady(true);
    }, 4200);
    return () => clearTimeout(timer);
  }, [line, stage]);
  useEffect(() => {
    if (stage !== "hello") return;
    const timer = setTimeout(() => setStage("name"), 6000);
    return () => clearTimeout(timer);
  }, [stage]);
  return (
    <main className={`welcome-screen ${stage === "intro" ? "cinema" : ""}`}>
      <AnimatePresence mode="wait">
        {stage === "intro" ? (
          <motion.section
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <p className="eyebrow">PARA JANNY</p>
            <div className="intro-lines">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={line}
                  initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 1.6 }}
                >
                  {lines[line]}
                </motion.h1>
              </AnimatePresence>
            </div>
            {ready && (
              <motion.button
                className="primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setStage("hello")}
              >
                Entrar <span>→</span>
              </motion.button>
            )}
            <button className="intro-skip" onClick={() => setStage("hello")}>
              Saltar introducción
            </button>
          </motion.section>
        ) : (
          <motion.section
            key={stage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className="welcome-character"
              initial={stage === "hello" ? { x: -360 } : false}
              animate={{
                x: stage === "hello" ? [-360, 10, -5, 0] : 0,
                rotate: stage === "hello" ? [0, 0, 8, -4, 0] : 0,
              }}
              transition={{ duration: 2.7 }}
            >
              <Nailoong
                animation={
                  stage === "hello"
                    ? "walk"
                    : stage === "welcome"
                      ? "happy"
                      : "thinking"
                }
                size={230}
              />
            </motion.div>
            {stage === "hello" && (
              <>
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.8 }}
                >
                  Holaaaaaaa 👋
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3.8 }}
                >
                  Soy Nailoong.
                </motion.p>
              </>
            )}
            {stage === "name" && (
              <>
                <h1>Antes de enseñarte todo esto…</h1>
                <p>¿Me dices tu nombre?</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (name.trim()) setStage("welcome");
                  }}
                >
                  <label className="sr-only" htmlFor="welcome-name">
                    Tu nombre
                  </label>
                  <input
                    id="welcome-name"
                    autoComplete="off"
                    maxLength={40}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre…"
                  />
                  <button className="primary" disabled={!name.trim()}>
                    Este es mi nombre
                  </button>
                </form>
              </>
            )}
            {stage === "welcome" && (
              <>
                <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {name.trim()}…
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                >
                  Me gusta. Entonces queda decidido.
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.8 }}
                >
                  ¡Holaaaa, {name.trim()}! ✨
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 5.5 }}
                >
                  Todo esto lo hizo Gela. O Gus Gus.
                  <br />
                  No entendí muy bien.
                </motion.p>
                <motion.button
                  className="primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 7 }}
                  onClick={() => onComplete(name.trim())}
                >
                  Hay una carta para ti <span>💌</span>
                </motion.button>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
