"use client";
import { useRef, type ReactNode } from "react";
export default function MessageGesture({
  id,
  unread,
  label,
  className,
  onReply,
  onHeart,
  children,
}: {
  id: string;
  unread: boolean;
  label: string;
  className: string;
  onReply: () => void;
  onHeart: () => void;
  children: ReactNode;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  return (
    <article
      data-message-id={id}
      data-unread={unread}
      aria-label={label}
      className={className}
      onTouchStart={(event) => {
        if (
          event.touches.length !== 1 ||
          (event.target as HTMLElement).closest("button,a,audio,input,textarea")
        ) {
          start.current = null;
          return;
        }
        start.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      }}
      onTouchCancel={() => {
        start.current = null;
        lastTap.current = null;
      }}
      onTouchEnd={(event) => {
        const origin = start.current;
        start.current = null;
        if (
          !origin ||
          !event.changedTouches.length ||
          window.getSelection()?.toString()
        )
          return;
        const touch = event.changedTouches[0],
          dx = touch.clientX - origin.x,
          dy = touch.clientY - origin.y;
        if (dx > 65 && Math.abs(dy) < 25) {
          lastTap.current = null;
          onReply();
          return;
        }
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          lastTap.current = null;
          return;
        }
        const previous = lastTap.current;
        const now = Date.now();
        if (
          previous &&
          now - previous.time < 320 &&
          Math.abs(previous.x - touch.clientX) < 25 &&
          Math.abs(previous.y - touch.clientY) < 25
        ) {
          if (event.cancelable) event.preventDefault();
          lastTap.current = null;
          onHeart();
        } else
          lastTap.current = { time: now, x: touch.clientX, y: touch.clientY };
      }}
    >
      {children}
    </article>
  );
}
