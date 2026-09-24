"use client";
import { useSubmitLock } from "@/lib/use-submit-lock";
import { foods, shop, streak } from "@/lib/constants";
import { useWorld } from "@/lib/world-store";
import { friendlyError } from "@/lib/data";
export default function CarePanel() {
  const {
    data,
    prefs,
    purchase,
    updatePrefs,
    say,
    reward,
    notify,
    setPanel,
    sound,
    feed,
  } = useWorld();
  const { busy, acquire, release } = useSubmitLock();
  async function buy(id: string) {
    if (!acquire()) return;
    try {
      await purchase(id);
      if (foods.some((f) => f.id === id)) {
        feed(foods.find((f) => f.id === id)!.icon);
        sound("food");
      } else {
        const item = shop.find((s) => s.id === id);
        if (item?.kind === "room") updatePrefs({ room: id });
        else updatePrefs({ accessory: id });
        say("¿Para mí? Me queda increíble. Claramente.", "jump");
      }
      setPanel(null);
    } catch (e) {
      notify(friendlyError(e));
    } finally {
      release();
    }
  }
  return (
    <>
      <div className="coin-summary">
        <span>
          ✦ {data.balance} <small>Nailocoins</small>
        </span>
        <p>
          {data.visits.length} visitas bonitas ·{" "}
          {streak(data.visits.map((v) => v.day))} días seguidos
        </p>
      </div>
      <p className="muted">
        Diez monedas al venir cada día. Algunos detalles también regalan tres.
        Sin compras reales y sin prisa.
      </p>
      <div className="care-actions">
        <button
          className="secondary"
          onClick={() => {
            say(
              "Abrazo recibido. Te devuelvo uno de tamaño considerable.",
              "hug",
            );
            sound();
            void reward("care").catch((e) => notify(friendlyError(e)));
            setPanel(null);
          }}
        >
          ♡ Darle un abrazo
        </button>
        <button
          className="secondary"
          onClick={() => {
            say(
              "Voy a cerrar los ojos. Estoy pensando muy fuerte, obviamente.",
              "sleepy",
            );
            setPanel(null);
          }}
        >
          ☾ Dejarlo descansar
        </button>
        <button
          className="secondary"
          onClick={() => {
            say("¡Mira! Casi despego.", "jump");
            setPanel(null);
          }}
        >
          ↟ Un saltito
        </button>
      </div>
      <h3>Algo rico para compartir</h3>
      <div className="shop-grid">
        {foods.map((f) => (
          <button
            key={f.id}
            disabled={busy || data.balance < f.cost}
            onClick={() => void buy(f.id)}
          >
            <span>{f.icon}</span>
            <strong>{f.name}</strong>
            <small>✦ {f.cost}</small>
          </button>
        ))}
      </div>
      <h3>Pequeños mundos, pequeños detalles</h3>
      <div className="shop-grid">
        {shop.map((item) => {
          const owned = data.unlocks.some((u) => u.item === item.id);
          const equipped =
            prefs.room === item.id || prefs.accessory === item.id;
          return (
            <button
              key={item.id}
              disabled={busy || (!owned && data.balance < item.cost)}
              onClick={() => {
                if (owned) {
                  updatePrefs(
                    item.kind === "room"
                      ? { room: item.id }
                      : { accessory: equipped ? "" : item.id },
                  );
                  setPanel(null);
                } else void buy(item.id);
              }}
            >
              <span>{item.icon}</span>
              <strong>{item.name}</strong>
              <small>
                {equipped ? "En uso" : owned ? "Usar" : `✦ ${item.cost}`}
              </small>
            </button>
          );
        })}
      </div>
      <button
        className="text-button"
        onClick={() => {
          updatePrefs({ room: "home", accessory: "" });
          setPanel(null);
        }}
      >
        Volver a la habitación, sin accesorios
      </button>
    </>
  );
}
