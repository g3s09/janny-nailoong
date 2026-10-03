"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Check } from "lucide-react";
export default function VoiceRecorder({
  onChoose,
  disabled,
  onRecordingChange,
}: {
  onChoose: (file: File) => void;
  disabled: boolean;
  onRecordingChange: (recording: boolean) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [asking, setAsking] = useState(false);
  const [clip, setClip] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const active = useRef(true);
  const discard = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      discard.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      if (timer.current) clearInterval(timer.current);
    };
  }, []);
  useEffect(() => {
    if (!clip) return;
    const value = URL.createObjectURL(clip);
    const task = setTimeout(() => setUrl(value), 0);
    return () => {
      clearTimeout(task);
      URL.revokeObjectURL(value);
    };
  }, [clip]);
  function stop(cancel = false) {
    discard.current = cancel;
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    if (timer.current) clearInterval(timer.current);
    setRecording(false);
    onRecordingChange(false);
  }
  async function start() {
    setError("");
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Este navegador no permite grabar. Puedes adjuntar un audio.");
      return;
    }
    setAsking(true);
    onRecordingChange(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!active.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType)
        throw new Error(
          "No se encontró un formato compatible. Puedes adjuntar un audio.",
        );
      const rec = new MediaRecorder(media, { mimeType });
      const chunks: Blob[] = [];
      discard.current = false;
      let size = 0;
      rec.ondataavailable = (event) => {
        if (event.data.size) {
          size += event.data.size;
          chunks.push(event.data);
          if (size > 14 * 1024 * 1024) stop();
        }
      };
      rec.onstop = () => {
        media.getTracks().forEach((track) => track.stop());
        if (timer.current) clearInterval(timer.current);
        if (!active.current) return;
        setRecording(false);
        onRecordingChange(false);
        if (discard.current) return;
        const type = mimeType.split(";")[0];
        const blob = new Blob(chunks, { type });
        if (!blob.size) {
          setError("No se grabó audio. Inténtalo otra vez.");
          return;
        }
        setClip(
          new File([blob], `nota-de-voz.${type.split("/")[1]}`, { type }),
        );
      };
      rec.onerror = () => {
        stop(true);
        setError("La grabación se interrumpió. Inténtalo de nuevo.");
      };
      recorder.current = rec;
      setClip(null);
      setUrl("");
      setSeconds(0);
      setRecording(true);
      onRecordingChange(true);
      rec.start(1000);
      let elapsed = 0;
      timer.current = setInterval(() => {
        elapsed++;
        setSeconds(elapsed);
        if (elapsed >= 180) stop();
      }, 1000);
    } catch (e) {
      stream.current?.getTracks().forEach((track) => track.stop());
      setRecording(false);
      onRecordingChange(false);
      if (active.current)
        setError(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "Activa el permiso del micrófono para grabar."
            : e instanceof Error
              ? e.message
              : "No se pudo abrir el micrófono.",
        );
    } finally {
      if (active.current) setAsking(false);
    }
  }
  return (
    <div className="voice-recorder">
      {recording ? (
        <>
          <span role="status" className="recording-time">
            ● {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}{" "}
            / 3:00
          </span>
          <button type="button" className="secondary" onClick={() => stop()}>
            <Square size={15} />
            Terminar
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => stop(true)}
          >
            Cancelar
          </button>
        </>
      ) : clip ? (
        <>
          <audio controls src={url} aria-label="Escuchar mi nota de voz" />
          <button
            type="button"
            className="secondary"
            disabled={disabled}
            onClick={() => {
              onChoose(clip);
              setClip(null);
              setUrl("");
            }}
          >
            <Check size={15} />
            Adjuntar
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setClip(null);
              setUrl("");
            }}
            aria-label="Descartar grabación"
          >
            <Trash2 size={17} />
          </button>
        </>
      ) : (
        <button
          type="button"
          className="text-button"
          disabled={disabled || asking}
          onClick={() => void start()}
        >
          <Mic size={16} />
          {asking ? "Abriendo micrófono…" : "Grabar audio"}
        </button>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
