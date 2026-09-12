/* eslint-disable @next/next/no-img-element -- Short-lived private signed URLs must not enter the Next image cache. */
"use client";
import { useEffect, useState } from "react";
import { signedFile } from "@/lib/data";
export default function PrivateMedia({
  path,
  type = "image",
  alt = "Un recuerdo",
}: {
  path: string;
  type?: string;
  alt?: string;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      signedFile(path)
        .then((value) => {
          if (active) {
            setUrl(value);
            setError(false);
          }
        })
        .catch(() => {
          if (active) setError(true);
        });
    };
    refresh();
    const timer = setInterval(refresh, 240000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [path]);
  if (error)
    return (
      <p className="error-text">
        No se pudo cargar el archivo. Vuelve a abrirlo para reintentar.
      </p>
    );
  if (!url) return <p className="muted">Abriendo un recuerdo…</p>;
  return type.startsWith("audio") ? (
    <audio controls preload="metadata" src={url} aria-label={alt} />
  ) : (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Ampliar: ${alt}`}
    >
      <img className="private-photo" src={url} alt={alt} />
    </a>
  );
}
