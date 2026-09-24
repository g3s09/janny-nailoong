import { redirect } from "next/navigation";
import { serverDb } from "@/lib/supabase/server";
import Experience from "../components/Experience";
export const dynamic = "force-dynamic";

export default async function Preview() {
  if (process.env.NODE_ENV !== "development") {
    const db = await serverDb();
    if (!db) redirect("/login");
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "gela") redirect("/");
  }
  return (
    <>
      <nav className="preview-toolbar">
        <a href="/gela">Volver a mi panel</a>
        <a href="/preview">Reiniciar prueba desde cero</a>
        <span>Vista de Janny · prueba</span>
      </nav>
      <Experience
        profile={{ id: "temporary-preview", name: "", role: "janny" }}
        preview
        freshStart
      />
    </>
  );
}
