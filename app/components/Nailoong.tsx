"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { CharacterState } from "@/lib/types";
const RiveCharacter = dynamic(() => import("./RiveCharacter"), { ssr: false });
export type NailoongAnimation = CharacterState;
type Props = {
  animation?: CharacterState;
  expression?: string;
  lookAt?: "user" | "left" | "right";
  interactive?: boolean;
  size?: number;
  name?: string;
  accessory?: string;
  onInteract?: () => void;
};
export default function Nailoong({
  animation = "idle",
  expression = "happy",
  lookAt = "user",
  interactive = true,
  size = 220,
  name = "Janny",
  accessory = "",
  onInteract,
}: Props) {
  const [message, setMessage] = useState("");
  const [bounce, setBounce] = useState(0);
  const [failed, setFailed] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const taps = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!interactive || reduced) return;
    let close: ReturnType<typeof setTimeout>;
    const interval = setInterval(
      () => {
        setBlink(true);
        close = setTimeout(() => setBlink(false), 160);
      },
      4300 + Math.random() * 2100,
    );
    return () => {
      clearInterval(interval);
      clearTimeout(close);
    };
  }, [interactive, reduced]);
  useEffect(() => {
    if (!interactive) return;
    function move(e: PointerEvent) {
      setLook({
        x: Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2)),
        y: Math.max(
          -1,
          Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2),
        ),
      });
    }
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
    };
  }, [interactive]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(""), 2600);
    return () => clearTimeout(timeout);
  }, [message]);
  const energetic =
    ["jump", "happy", "hello", "wave", "hug", "surprised", "laugh"].includes(
      animation,
    ) || bounce > 0;
  const motionState = reduced
    ? {}
    : animation === "walk"
      ? { y: [0, -8, 0, -8, 0], rotate: [-3, 3, -3, 3, 0] }
      : energetic
        ? {
            y: [0, 7, -27, 0, -6, 0],
            scaleY: [1, 0.88, 1.09, 0.93, 1.02, 1],
            scaleX: [1, 1.08, 0.95, 1.04, 1, 1],
          }
        : animation === "fall"
          ? { rotate: [0, 16, 65, 30, 0], y: [0, 15, 20, 8, 0] }
          : animation === "sleepy" || animation === "sit"
            ? { scaleY: [0.95, 0.93, 0.95], y: [6, 8, 6], rotate: [0, 2, 0] }
            : animation === "eat"
              ? { scaleX: [1, 1.04, 1], y: [0, 3, 0], rotate: [-2, 2, -2] }
              : {
                  y: [0, -4, 0],
                  scaleY: [1, 1.015, 1],
                  rotate:
                    lookAt === "left" || animation === "look-left"
                      ? -4
                      : lookAt === "right"
                        ? 4
                        : look.x * 1.4,
                };
  function tap() {
    if (!interactive) return;
    taps.current++;
    if (timer.current) clearTimeout(timer.current);
    setBounce((v) => v + 1);
    onInteract?.();
    timer.current = setTimeout(() => {
      setMessage(
        taps.current === 1
          ? "Jeje 👀"
          : taps.current === 2
            ? "¿Qué haces? 😳"
            : taps.current === 3
              ? `${name}…`
              : "¡YA TE VI! 😭",
      );
      taps.current = 0;
      setBounce(0);
    }, 350);
  }
  const src = process.env.NEXT_PUBLIC_NAILOONG_RIVE;
  return (
    <div className="nailoong-wrap" style={{ width: size }}>
      {message && (
        <div className="tap-bubble" role="status">
          {message}
        </div>
      )}
      <motion.button
        type="button"
        aria-label="Acariciar a Nailoong"
        disabled={!interactive}
        onClick={tap}
        className="nailoong-body"
        style={{ width: size, height: size, transformOrigin: "50% 92%" }}
        animate={motionState}
        transition={{
          duration: energetic ? 1.1 : animation === "walk" ? 1 : 3.8,
          repeat: energetic ? 0 : Infinity,
          ease: "easeInOut",
        }}
        whileTap={reduced ? undefined : { scaleY: 0.84, scaleX: 1.08, y: 9 }}
      >
        {src && !failed ? (
          <RiveCharacter
            src={src}
            animation={animation}
            expression={expression}
            look={look}
            onError={() => setFailed(true)}
          />
        ) : (
          <>
            <Image
              src="/nailoong/nailoong-idle.png"
              alt="Nailoong, tu pequeño compañero amarillo"
              fill
              priority
              draggable={false}
              sizes="(max-width: 700px) 160px, 230px"
              className="nailoong-image"
            />
            <span className={`eyelid eye-left ${blink ? "blink" : ""}`} />
            <span className={`eyelid eye-right ${blink ? "blink" : ""}`} />
          </>
        )}
        {accessory && (
          <span
            className={`accessory ${accessory}`}
            aria-label={accessory === "scarf" ? "Bufanda" : "Flor"}
          >
            {accessory === "scarf" ? "🧣" : "🌼"}
          </span>
        )}
        {animation === "sleepy" && <span className="sleep-marks">z z Z</span>}
      </motion.button>
    </div>
  );
}
