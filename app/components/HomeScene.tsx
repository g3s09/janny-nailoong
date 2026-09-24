"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Heart,
  Settings2,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Mail,
  Sparkles,
} from "lucide-react";
import Nailoong from "./Nailoong";
import UnreadBadge from "./UnreadBadge";
import RoomArt from "./RoomArt";
import { useWorld } from "@/lib/world-store";
import { moods, today } from "@/lib/constants";
import { friendlyError } from "@/lib/data";
import type { Panel } from "@/lib/types";
import OutdoorScene from "./OutdoorScene";
import SeasonalDecor from "./SeasonalDecor";
import { useNarrative } from "@/lib/use-narrative";
export default function HomeScene({
  name,
}: {
  name: string;
  onRepeat: () => void;
}) {
  useNarrative(name);
  const {
    prefs,
    updatePrefs,
    setPanel,
    speech,
    character,
    treat,
    sound,
    data,
    say,
    setMoodDraft,
    reward,
    notify,
    loading,
    error,
    refresh,
    conversation,
  } = useWorld();
  const [hour, setHour] = useState(12);
  useEffect(() => {
    const update = () => setHour(new Date().getHours());
    const timer = setTimeout(update, 0);
    const interval = setInterval(update, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);
  const night = prefs.night ?? (hour >= 19 || hour < 7);
  const unread = conversation.unreadCount;
  const currentMood = data.moods.find((m) => m.day === today());
  const special = data.events.find(
    (e) =>
      e.day === today() || (e.annual && e.day.slice(5) === today().slice(5)),
  );
  const holiday = {
    "12-25": "Feliz Navidad, Janny",
    "01-01": "Otro comienzo contigo",
    "02-14": "Qué bonito haberte encontrado",
    "11-02": "Recordar también es querer",
  }[today().slice(5)];
  function open(panel: Panel) {
    sound();
    setPanel(panel);
    if (panel === "mail")
      say("El buzón tiene el mejor trabajo de la casa.", "look-left");
    else if (panel === "diary")
      say("Te cuido el silencio. Aquí puedes escribir a tu ritmo.", "sit");
    else if (panel === "memories")
      say("¿Miramos un ratito las cosas que merecen quedarse?", "happy");
    else if (panel === "box")
      say("Estos sobres guardan abrazos. Lo comprobé personalmente.", "hug");
    else if (panel === "calendar")
      say("Tengo una excelente memoria para los días con pastel.", "thinking");
  }
  return (
    <div className={`world ${night ? "night" : ""}`}>
      <header className="world-header">
        <Link className="wordmark" href="/">
          <span className="brand-sun">✳</span>
          <span>
            el rincón de <strong>Janny</strong>
            <small>DE MÍ, PARA TI</small>
          </span>
        </Link>
        <div className="header-actions">
          <button className="icon-button mail-shortcut" aria-label="Abrir mensajes" onClick={() => open("mail")}>
            <Mail size={18} />
            <UnreadBadge count={unread} />
          </button>
          <button
            className="icon-button"
            aria-label={prefs.effects ? "Silenciar sonidos" : "Activar sonidos"}
            onClick={() => {
              updatePrefs({ effects: !prefs.effects });
              if (!prefs.effects) notify("Pequeños sonidos activados.");
            }}
          >
            {prefs.effects ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            className="icon-button"
            aria-label="Configuración"
            onClick={() => open("settings")}
          >
            <Settings2 size={18} />
          </button>
        </div>
      </header>
      <main className="world-main">
        <div className="scene-heading">
          <div>
            <p className="eyebrow">QUÉ GUSTO VERTE POR AQUÍ</p>
            <h1>
              {hour < 12
                ? "Buenos días"
                : hour < 19
                  ? "Qué bonita tarde"
                  : "Una noche tranquila"}
              , {name || "Janny"}.
            </h1>
            <p>Tenía ganas de hacer algo bonito para ti. Ojalá te guste, Janny.</p>
          </div>
          <button
            className="time-switch"
            onClick={() => updatePrefs({ night: !night })}
          >
            {night ? <Moon size={15} /> : <Sun size={17} />}{" "}
            {night ? "Noche tranquila" : "Una tarde bonita"}
          </button>
        </div>
        {error && (
          <div className="connection-error" role="alert">
            No pudimos abrir tus datos.{" "}
            <button onClick={() => void refresh()}>Reintentar</button>
            <small>{error}</small>
          </div>
        )}
        <section
          className={`room room-${prefs.room} ${special || holiday ? "celebration" : ""}`}
          aria-label="La habitación de Nailoong"
        >
          {prefs.room === "home" ? (
            <RoomArt />
          ) : (
            <OutdoorScene room={prefs.room} />
          )}
          {(special || holiday) && (
            <SeasonalDecor
              kind={
                special?.decoration ??
                (today().slice(5) === "12-25"
                  ? "winter"
                  : today().slice(5) === "02-14"
                    ? "hearts"
                    : "stars")
              }
            />
          )}
          <div className="room-caption">
            <span className="status-dot" />
            {special?.title || holiday || "Quédate un ratito conmigo"}
          </div>
          <span className="room-coordinate">
            {{
              home: "01 / LA HABITACIÓN",
              kitchen: "02 / LA COCINA",
              garden: "03 / EL JARDÍN",
              roof: "04 / LA AZOTEA",
              space: "05 / ENTRE ESTRELLAS",
            }[prefs.room] || "UN LUGAR CONTIGO"}
          </span>
          <div className="room-character">
            <div className="speech" aria-live="polite">
              {speech}
            </div>
            <Nailoong
              animation={character}
              treat={treat}
              size={210}
              name={name}
              accessory={prefs.accessory}
              onInteract={() => {
                sound();
                void reward("care").catch((e) => notify(friendlyError(e)));
              }}
            />
            <button className="character-hint" onClick={() => open("care")}>
              Un ratito conmigo <span>♡</span>
            </button>
          </div>
          <button
            className={`hotspot mail-spot ${unread ? "has-mail" : ""}`}
            onClick={() => open("mail")}
          >
            Escríbeme{" "}
            <UnreadBadge count={unread} />
            <ArrowUpRight size={12} />
          </button>
          <button
            className="hotspot memories-spot"
            onClick={() => open("memories")}
          >
            Nuestros recuerdos <ArrowUpRight size={12} />
          </button>
          <button className="hotspot diary-spot" onClick={() => open("diary")}>
            Mi diario <ArrowUpRight size={12} />
          </button>
          <button className="hotspot box-spot" onClick={() => open("box")}>
            Ábrelo cuando… <ArrowUpRight size={12} />
          </button>
          <button
            className="hotspot calendar-spot"
            onClick={() => open("calendar")}
          >
            Días especiales <ArrowUpRight size={12} />
          </button>
          <button
            className="plant-secret"
            aria-label="Mirar detrás de la planta"
            onClick={() => {
              say(
                "Encontraste mi escondite. Hay tres monedas. La galleta ya no.",
                "surprised",
              );
              void reward("secret").catch((e) => notify(friendlyError(e)));
              sound("unlock");
            }}
          />
          <button
            className="window-button"
            aria-label="Cambiar la luz de la ventana"
            onClick={() => updatePrefs({ night: !night })}
          />
          <div className="room-instruction">
            <Sparkles size={13} /> Te dejé varias cositas. Toca una y mira qué hay.
          </div>
          {loading && (
            <span className="room-loading">Abriendo tus recuerdos…</span>
          )}
        </section>
        <div className="under-room">
          <div className="mood-inline">
            <span>
              Antes de seguir… <strong>¿cómo estás hoy?</strong>
            </span>
            <div>
              {moods.map((m, i) => (
                <button
                  key={m.label}
                  title={m.label}
                  aria-label={m.label}
                  aria-pressed={currentMood?.mood === i}
                  onClick={() => {
                    setMoodDraft(i);
                    say(m.response, i === 6 ? "sleepy" : "hug");
                    open("diary");
                  }}
                >
                  {m.face}
                </button>
              ))}
            </div>
          </div>
          <p className="handwritten">
            Te quiero mucho, Janny.
            <br />
            Por si hoy no te lo había dicho. <Heart size={14} />
          </p>
        </div>
        <footer className="world-footer">
          <button className="text-button" onClick={() => open("care")}>
            ✦ {data.balance} Nailocoins
          </button>
          <button className="text-button" onClick={() => open("letter")}>
            Con cariño, Gela <Heart size={12} />
          </button>
        </footer>
      </main>
    </div>
  );
}
