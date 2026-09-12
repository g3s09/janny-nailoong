import { redirect } from "next/navigation";
import { serverDb } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import Admin from "./Admin";
export const dynamic = "force-dynamic";
export default async function Gela() {
  const db = await serverDb();
  if (!db) redirect("/login");
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "gela") redirect("/");
  return <Admin profile={profile as Profile} />;
}
