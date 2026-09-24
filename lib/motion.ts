import type { TargetAndTransition, Transition } from "motion/react";

// Shared by the room dialogs and the administrator's panels.
export function sectionMotion(section: string, reduced: boolean | null) {
  const initial: TargetAndTransition = reduced
    ? { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, rotateY: 0 }
    : {
        opacity: 0,
        x: 0,
        y: section === "mail" ? 36 : 18,
        scale: section === "box" || section === "open_when" ? 0.94 : 0.985,
        rotate: section === "memories" ? -1.5 : 0,
        rotateY: section === "diary" ? -10 : 0,
      };
  const transition: Transition = {
    duration: reduced ? 0 : 0.36,
    ease: [0.22, 1, 0.36, 1],
  };
  return {
    initial,
    animate: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, rotateY: 0 },
    exit: {
      opacity: reduced ? 1 : 0,
      y: reduced ? 0 : 10,
      transition: { duration: reduced ? 0 : 0.18 },
    },
    transition,
  };
}
