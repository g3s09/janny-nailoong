"use client";
import { useRouter } from "next/navigation";
import { useWorld } from "@/lib/world-store";
import { browserDb } from "@/lib/supabase/client";
import type { Preferences } from "@/lib/types";
import PushSettings from "./PushSettings";
import { clearDeviceSession } from "@/lib/device-session";
import Link from "next/link";
export default function SettingsPanel({ onRepeat }: { onRepeat: () => void }) {
  const router = useRouter();
  const { prefs, updatePrefs, preview, setPanel, notify, profile } = useWorld();
  const toggles: {
    key: keyof Preferences;
    title: string;
    description: string;
  }[] = [
    {
      key: "music",
      title: "Un fondo tranquilo",
      description: "Un ambiente sonoro muy suave, solo cuando tú quieras.",
    },
    {
      key: "effects",
      title: "Pequeños sonidos",
      description: "Cartas, saltitos y descubrimientos.",
    },
    {
      key: "haptics",
      title: "Pequeños toques",
      description: "Vibración suave si tu teléfono la permite.",
    },
    {
      key: "notifications",
      title: "Avisos dentro del rincón",
      description: "Una señal cuando llega una carta mientras estás aquí.",
    },
  ];
  return (
    <>
      <div className="settings-list">
        {toggles.map((t) => (
          <label key={t.key}>
            <span>
              <strong>{t.title}</strong>
              <small>{t.description}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={Boolean(prefs[t.key])}
              onChange={(e) => updatePrefs({ [t.key]: e.target.checked })}
            />
          </label>
        ))}
      </div>
      <button className="secondary" onClick={onRepeat}>
        ↺ Repetir bienvenida
      </button>
      <button className="text-button" onClick={() => setPanel("letter")}>
        Volver a leer la carta de Gela
      </button>
      <div className="install-note">
        <h3>Llévate este rincón contigo.</h3>
        <p>
          En iPhone: Compartir → Añadir a pantalla de inicio. En Android o PC:
          usa «Instalar aplicación» en el menú del navegador.
        </p>
        <p>
          Necesita una dirección HTTPS para instalarse fuera de este equipo. Sin
          conexión aparecerá una pequeña pantalla de compañía; tus cartas y tu
          diario no se almacenan en la caché.
        </p>
      </div>
      <PushSettings />
      {!preview && (
        <Link href="/password" className="text-button">
          Cambiar mi contraseña
        </Link>
      )}
      {!preview && (
        <button
          className="text-button"
          onClick={async () => {
            await clearDeviceSession(profile.id);
            const { error } = await browserDb().auth.signOut();
            if (error) {
              notify("No se pudo cerrar la sesión. Inténtalo de nuevo.");
              return;
            }
            router.replace("/login");
            router.refresh();
          }}
        >
          Cerrar mi sesión
        </button>
      )}
    </>
  );
}
