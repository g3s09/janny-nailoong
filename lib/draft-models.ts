import type { Memory } from "./types";
import type { MessageSubmission } from "./validation";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid draft");
  return value as Record<string, unknown>;
}
function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
export type MailDraft = {
  text: string;
  important: boolean;
  schedule: string;
  pending: MessageSubmission | null;
};
export const emptyMail: MailDraft = {
  text: "",
  important: false,
  schedule: "",
  pending: null,
};
export function decodeMail(value: unknown): MailDraft {
  if (typeof value === "string") return { ...emptyMail, text: value };
  const v = object(value);
  let pending: MessageSubmission | null = null;
  if (v.pending) {
    const p = object(v.pending);
    if (
      typeof p.requestId !== "string" ||
      typeof p.recipientId !== "string" ||
      typeof p.body !== "string" ||
      typeof p.deliverAt !== "string"
    )
      throw new Error("Invalid pending send");
    pending = {
      requestId: p.requestId,
      recipientId: p.recipientId,
      body: p.body,
      deliverAt: p.deliverAt,
      important: p.important === true,
      attachment: typeof p.attachment === "string" ? p.attachment : null,
      attachmentType:
        typeof p.attachmentType === "string" ? p.attachmentType : null,
    };
  }
  return {
    text: text(v.text),
    important: v.important === true,
    schedule: text(v.schedule),
    pending,
  };
}
export type DiaryDraft = { note: string; mood: number | null };
export function decodeDiary(value: unknown): DiaryDraft {
  if (typeof value === "string") return { note: value, mood: null };
  const v = object(value);
  return {
    note: text(v.note),
    mood:
      typeof v.mood === "number" &&
      Number.isInteger(v.mood) &&
      v.mood >= 0 &&
      v.mood <= 6
        ? v.mood
        : null,
  };
}
export type MemoryDraft = Partial<Memory> & { saveId?: string };
export function decodeMemory(value: unknown): MemoryDraft | null {
  if (value === null) return null;
  const v = object(value);
  return {
    id: typeof v.id === "string" ? v.id : undefined,
    saveId: typeof v.saveId === "string" ? v.saveId : undefined,
    title: text(v.title),
    body: text(v.body),
    date: text(v.date),
    place: text(v.place),
    attachment: typeof v.attachment === "string" ? v.attachment : null,
    audio: typeof v.audio === "string" ? v.audio : null,
  };
}
export type ContentDraft = {
  id?: string;
  saveId?: string;
  title: string;
  body: string;
  day: string;
  annual: boolean;
  decoration: string;
  once: boolean;
  available_at: string;
  state: string;
  attachment: string | null;
  audio: string | null;
};
export function decodeContent(value: unknown): ContentDraft | null {
  if (value === null) return null;
  const v = object(value);
  return {
    id: typeof v.id === "string" ? v.id : undefined,
    saveId: typeof v.saveId === "string" ? v.saveId : undefined,
    title: text(v.title),
    body: text(v.body),
    day: text(v.day),
    annual: v.annual === true,
    decoration: text(v.decoration, "stars"),
    once: v.once === true,
    available_at: text(v.available_at),
    state: text(v.state, "idle"),
    attachment: typeof v.attachment === "string" ? v.attachment : null,
    audio: typeof v.audio === "string" ? v.audio : null,
  };
}
