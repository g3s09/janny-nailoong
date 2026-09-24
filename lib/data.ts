import { validateFile } from "./validation";
import { browserDb } from "./supabase/client";
import { type Snapshot, type Profile } from "./types";
export const snapshotTables = [
  "profiles",
  "memories",
  "moods",
  "open_when",
  "events",
  "unlocks",
  "visits",
  "notifications",
  "phrases",
  "coins",
] as const;
export type SnapshotTable = (typeof snapshotTables)[number];
export async function loadSnapshot(
  tables: readonly SnapshotTable[] = snapshotTables,
): Promise<Partial<Snapshot>> {
  const db = browserDb();
  const results = await Promise.all(
    tables.map((table) =>
      db.from(table).select(table === "coins" ? "amount" : "*"),
    ),
  );
  const failure = results.find((result) => result.error);
  if (failure?.error) throw new Error(failure.error.message);
  const snapshot: Partial<Snapshot> = {};
  tables.forEach((table, index) => {
    if (table === "coins")
      snapshot.balance = (results[index].data ?? []).reduce(
        (sum: number, row: { amount: number }) => sum + Number(row.amount),
        0,
      );
    else Object.assign(snapshot, { [table]: results[index].data ?? [] });
  });
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
  validateFile(file);
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
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    if (/failed to fetch|network|fetch failed/i.test(error.message))
      return "No pudimos conectar. Tus cambios siguen aquí; inténtalo cuando vuelva la conexión.";
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : "No se pudo guardar. Inténtalo de nuevo; tu texto sigue aquí.";
}
