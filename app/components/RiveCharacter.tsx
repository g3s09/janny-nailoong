/* eslint-disable react-hooks/immutability -- Rive state machine inputs are imperative runtime handles, not React state. */
"use client";
import { useEffect } from "react";
import {
  useRive,
  useStateMachineInput,
  Layout,
  Fit,
  Alignment,
} from "@rive-app/react-canvas";
import type { CharacterState } from "@/lib/types";
const states: CharacterState[] = [
  "idle",
  "walk",
  "hello",
  "wave",
  "happy",
  "thinking",
  "surprised",
  "sleepy",
  "sad",
  "laugh",
  "eat",
  "jump",
  "fall",
  "sit",
  "hug",
  "look-left",
  "look-right",
  "blink",
];
export default function RiveCharacter({
  src,
  animation,
  expression,
  look,
  onError,
}: {
  src: string;
  animation: CharacterState;
  expression: string;
  look: { x: number; y: number };
  onError: () => void;
}) {
  const machine = process.env.NEXT_PUBLIC_RIVE_STATE_MACHINE || "Nailoong";
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: machine,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter }),
    onLoadError: onError,
  });
  const state = useStateMachineInput(rive, machine, "state");
  const x = useStateMachineInput(rive, machine, "lookX");
  const y = useStateMachineInput(rive, machine, "lookY");
  const happy = useStateMachineInput(rive, machine, "happy");
  useEffect(() => {
    if (state) state.value = states.indexOf(animation);
    else if (rive?.animationNames.includes(animation)) {
      rive.stop();
      rive.play(animation);
    }
  }, [state, animation, rive]);
  useEffect(() => {
    if (x) x.value = look.x;
    if (y) y.value = look.y;
    if (happy) happy.value = expression === "happy";
  }, [x, y, happy, look, expression]);
  return <RiveComponent aria-label="Nailoong animado" />;
}
