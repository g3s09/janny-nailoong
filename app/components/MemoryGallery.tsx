"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Memory } from "@/lib/types";
import PrivateMedia from "./PrivateMedia";
import { prettyDate } from "@/lib/constants";
export default function MemoryGallery({
  memories,
  initialId,
  onClose,
}: {
  memories: Memory[];
  initialId: string;
  onClose: () => void;
}) {
  const photos = memories.filter((memory) => memory.attachment);
  const [id, setId] = useState(initialId);
  const index = Math.max(
    0,
    photos.findIndex((memory) => memory.id === id),
  );
  const memory = photos[index];
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  function move(direction: number) {
    const next = photos[index + direction];
    if (next) setId(next.id);
  }
  useEffect(() => {
    const el = dialog.current;
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    el?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = overflow;
      before?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="memory-gallery"
      aria-label="Álbum de recuerdos"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
      }}
    >
      <header>
        <span>
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Cerrar álbum"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {memory && (
        <>
          <div
            className="gallery-image"
            onTouchStart={(event) => {
              if (event.touches.length === 1)
                touch.current = {
                  x: event.touches[0].clientX,
                  y: event.touches[0].clientY,
                };
              else touch.current = null;
            }}
            onTouchEnd={(event) => {
              const start = touch.current;
              touch.current = null;
              if (!start || !event.changedTouches.length) return;
              const dx = event.changedTouches[0].clientX - start.x;
              const dy = event.changedTouches[0].clientY - start.y;
              if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5)
                move(dx > 0 ? -1 : 1);
            }}
          >
            <PrivateMedia
              key={memory.id}
              path={memory.attachment!}
              alt={memory.title}
              inline
            />
          </div>
          <footer>
            <button
              type="button"
              className="icon-button"
              aria-label="Foto anterior"
              disabled={index === 0}
              onClick={() => move(-1)}
            >
              <ChevronLeft />
            </button>
            <div>
              <h2>{memory.title}</h2>
              <small>
                {prettyDate(memory.date)}
                {memory.place ? ` · ${memory.place}` : ""}
              </small>
              {memory.body && <p>{memory.body}</p>}
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Foto siguiente"
              disabled={index === photos.length - 1}
              onClick={() => move(1)}
            >
              <ChevronRight />
            </button>
          </footer>
        </>
      )}
    </dialog>
  );
}
