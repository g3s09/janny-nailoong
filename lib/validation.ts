export const limits = {
  body: 10000,
  title: 160,
  place: 200,
  phrase: 300,
  fileBytes: 15 * 1024 * 1024,
} as const;
export const fileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/webm",
  "audio/wav",
] as const;
export class InputError extends Error {}
export function textValue(
  value: unknown,
  label: string,
  max: number,
  required = false,
) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new InputError(
      `${label}: escribe ${required ? "entre 1 y" : "como máximo"} ${max} caracteres.`,
    );
  return value.trim();
}
export function uuid(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new InputError("El identificador del envío no es válido.");
  return value;
}
export function dayValue(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw new InputError("Elige una fecha válida.");
  return value;
}
export function dateTimeValue(value: unknown) {
  if (
    typeof value !== "string" ||
    !value ||
    !Number.isFinite(Date.parse(value))
  )
    throw new InputError("Elige una fecha y hora válidas.");
  return new Date(value).toISOString();
}
export function validateFile(file: Pick<File, "size" | "type">) {
  if (file.size <= 0 || file.size > limits.fileBytes)
    throw new InputError(
      "El archivo debe tener contenido y pesar como máximo 15 MB.",
    );
  if (!(fileTypes as readonly string[]).includes(file.type))
    throw new InputError(
      "Elige una imagen JPG, PNG, WebP o GIF, o un audio MP3, MP4, OGG, WebM o WAV.",
    );
}
export type MessageSubmission = {
  requestId: string;
  recipientId: string;
  body: string;
  attachment: string | null;
  attachmentType: string | null;
  important: boolean;
  deliverAt: string;
};
export function parseMessage(value: unknown, owner: string): MessageSubmission {
  if (!value || typeof value !== "object")
    throw new InputError("El envío no es válido.");
  const v = value as Record<string, unknown>;
  const body = textValue(v.body, "La carta", limits.body);
  const attachment =
    v.attachment == null
      ? null
      : textValue(v.attachment, "El archivo", 300, true);
  if (!body && !attachment)
    throw new InputError("Escribe unas palabras o añade un archivo.");
  const attachmentType =
    v.attachmentType == null ? null : String(v.attachmentType);
  if (
    attachment &&
    (!attachment.startsWith(`${owner}/`) ||
      !/^[\da-f-]+\/[\da-f-]+\.[a-z0-9]+$/i.test(attachment) ||
      !(fileTypes as readonly string[]).includes(attachmentType ?? ""))
  )
    throw new InputError("El archivo no pertenece a este envío.");
  if (!attachment && attachmentType !== null)
    throw new InputError("Falta el archivo adjunto.");
  if (typeof v.important !== "boolean")
    throw new InputError("El tipo de carta no es válido.");
  return {
    requestId: uuid(v.requestId),
    recipientId: uuid(v.recipientId),
    body,
    attachment,
    attachmentType,
    important: v.important,
    deliverAt: dateTimeValue(v.deliverAt),
  };
}
