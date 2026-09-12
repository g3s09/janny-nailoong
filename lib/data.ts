import { browserDb } from "./supabase/client";
import { emptySnapshot, type Snapshot, type Profile } from "./types";
export async function loadSnapshot(): Promise<Snapshot> {
  const db = browserDb();
  const tables = [
    "profiles",
    "messages",
    "memories",
    "moods",
    "open_when",
    "events",
    "unlocks",
    "visits",
    "notifications",
    "phrases",
  ] as const;
  const results = await Promise.all(
    tables.map((table) => db.from(table).select("*")),
  );
  const failure = results.find((result) => result.error);
  if (failure?.error) throw new Error(failure.error.message);
  const snapshot = { ...emptySnapshot };
  tables.forEach((table, index) =>
    Object.assign(snapshot, { [table]: results[index].data ?? [] }),
  );
  const coins = await db.from("coins").select("amount");
  if (coins.error) throw new Error(coins.error.message);
  snapshot.balance = (coins.data ?? []).reduce(
    (sum: number, row: { amount: number }) => sum + row.amount,
    0,
  );
  return snapshot;
}
export async function getProfile(): Promise<Profile | null> {
  const db = browserDb();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return null;
  const { data } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data as Profile | null;
}
export async function uploadFile(file: File, owner: string) {
  if (file.size > 15 * 1024 * 1024)
    throw new Error("El archivo debe pesar menos de 15 MB.");
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/webm",
    "audio/wav",
  ];
  if (!allowed.includes(file.type))
    throw new Error(
      "Elige una imagen JPG, PNG, WebP o GIF, o un archivo de audio compatible.",
    );
  const ext = file.type.split("/")[1].replace("mpeg", "mp3");
  const path = `${owner}/${crypto.randomUUID()}.${ext}`;
  const { error } = await browserDb()
    .storage.from("keepsakes")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
export async function signedFile(path: string) {
  const { data, error } = await browserDb()
    .storage.from("keepsakes")
    .createSignedUrl(path, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
export async function removeFile(path: string) {
  await browserDb().storage.from("keepsakes").remove([path]);
}
export function friendlyError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo guardar. Inténtalo de nuevo; tu texto sigue aquí.";
}
