"use client";
import ProfilePhotoSettings from "./ProfilePhotoSettings";
import { useWorld } from "@/lib/world-store";
export default function AppearanceSettings({
  sounds = false,
}: {
  sounds?: boolean;
}) {
  const { prefs, updatePrefs } = useWorld();
  return (
    <div className="appearance-settings">
      <ProfilePhotoSettings />
      <fieldset>
        <legend>Luz</legend>
        <div className="preference-options">
          {(
            [
              { value: null, label: "Automática" },
              { value: false, label: "Día" },
              { value: true, label: "Noche" },
            ] as const
          ).map(({ value, label }) => (
            <button
              type="button"
              className="secondary"
              aria-pressed={prefs.night === value}
              key={label}
              onClick={() => updatePrefs({ night: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Colores</legend>
        <div className="preference-options">
          {(
            [
              ["honey", "Miel"],
              ["rose", "Rosa"],
              ["lavender", "Lavanda"],
            ] as const
          ).map(([value, label]) => (
            <button
              className={`palette-choice swatch-${value}`}
              key={value}
              type="button"
              aria-pressed={prefs.palette === value}
              onClick={() => updatePrefs({ palette: value })}
            >
              <span aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Fondo</legend>
        <div className="preference-options">
          {(
            [
              ["plain", "Liso"],
              ["dots", "Puntitos"],
              ["stars", "Estrellas"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              className="secondary"
              key={value}
              aria-pressed={prefs.backdrop === value}
              onClick={() => updatePrefs({ backdrop: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      {sounds && (
        <div className="settings-list">
          <label>
            <strong>Sonidos</strong>
            <input
              type="checkbox"
              role="switch"
              checked={prefs.effects}
              onChange={(event) =>
                updatePrefs({ effects: event.target.checked })
              }
            />
          </label>
          <label>
            <strong>Música de fondo</strong>
            <input
              type="checkbox"
              role="switch"
              checked={prefs.music}
              onChange={(event) => updatePrefs({ music: event.target.checked })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
