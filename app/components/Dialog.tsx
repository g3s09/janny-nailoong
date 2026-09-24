"use client";
import { sectionMotion } from "@/lib/motion";
import { useEffect, useRef, useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { motion, useIsPresent, useReducedMotion } from "motion/react";
export default function Dialog({
  title,
  subtitle,
  children,
  onClose,
  kind = "default",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  kind?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const present = useIsPresent();
  const reduced = useReducedMotion();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <motion.dialog
      ref={ref}
      className="paper-dialog"
      data-section={kind}
      data-exiting={!present || undefined}
      {...sectionMotion(kind, reduced)}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-header">
        <div>
          <p className="eyebrow">EL RINCÓN DE JANNY</p>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar">
          <X size={19} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </motion.dialog>
  );
}
