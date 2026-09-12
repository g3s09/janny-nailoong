import { redirect } from "next/navigation";
import { serverDb } from "@/lib/supabase/server";
import { previewAllowed } from "@/lib/supabase/client";
import Experience from "./components/Experience";
import type { Profile } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function Home() {
  const db = await serverDb();
  if (!db) {
    if (previewAllowed)
      return (
        <Experience
          profile={{ id: "local-preview", name: "Janny", role: "janny" }}
          preview
        />
      );
    redirect("/login");
  }
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login?restricted=1");
  if (profile.role === "gela") redirect("/gela");
  return <Experience profile={profile as Profile} preview={false} />;
}
