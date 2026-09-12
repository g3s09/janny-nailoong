"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { browserDb } from "./supabase/client";
import { loadSnapshot, friendlyError } from "./data";
import {
  emptySnapshot,
  type Snapshot,
  type Preferences,
  type Profile,
  type CharacterState,
  type Panel,
} from "./types";
import { foods, shop, today } from "./constants";
import { playSound, setAmbience } from "./sound";
const defaultPrefs: Preferences = {
  music: false,
  effects: false,
  haptics: true,
  night: null,
  room: "home",
  accessory: "",
  notifications: true,
};
type World = {
  profile: Profile;
  preview: boolean;
  data: Snapshot;
  prefs: Preferences;
  panel: Panel;
  character: CharacterState;
  speech: string;
  toast: string;
  error: string;
  loading: boolean;
  moodDraft: number | null;
  setMoodDraft: (m: number | null) => void;
  setPanel: (p: Panel) => void;
  setCharacter: (s: CharacterState) => void;
  say: (s: string, c?: CharacterState) => void;
  notify: (s: string) => void;
  refresh: () => Promise<void>;
  updatePrefs: (p: Partial<Preferences>) => void;
  sound: (kind?: "tap" | "letter" | "food" | "unlock") => void;
  purchase: (id: string) => Promise<void>;
  reward: (activity: string, reference?: string) => Promise<void>;
  localUpdate: (fn: (s: Snapshot) => Snapshot) => void;
};
const Context = createContext<World | null>(null);
export function WorldProvider({
  children,
  profile,
  preview,
}: {
  children: ReactNode;
  profile: Profile;
  preview: boolean;
}) {
  const [moodDraft, setMoodDraft] = useState<number | null>(null);
  const [data, setData] = useState<Snapshot>(emptySnapshot);
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [panel, setPanel] = useState<Panel>(null);
  const [character, setCharacter] = useState<CharacterState>("idle");
  const [speech, setSpeech] = useState(
    "Te guardé el lugar más bonito. Bueno… y una galleta. Casi.",
  );
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const knownMessages = useRef<Set<string> | null>(null);
  const prefsRef = useRef(prefs);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);
  const notify = useCallback((text: string) => setToast(text), []);
  const sound = useCallback(
    (kind: "tap" | "letter" | "food" | "unlock" = "tap") => {
      if (prefsRef.current.effects) playSound(kind);
      if (prefsRef.current.haptics && typeof navigator.vibrate === "function")
        navigator.vibrate(kind === "letter" ? [20, 40, 20] : 12);
    },
    [],
  );
  const say = useCallback((text: string, state: CharacterState = "happy") => {
    setSpeech(text);
    setCharacter(state);
  }, []);
  const refresh = useCallback(async () => {
    if (preview) return;
    try {
      const { error: deliveryError } =
        await browserDb().rpc("deliver_messages");
      if (deliveryError) throw new Error(deliveryError.message);
      const next = await loadSnapshot();
      const incoming = next.messages.filter(
        (m) => m.recipient_id === profile.id && m.read_at === null,
      );
      if (
        knownMessages.current &&
        incoming.some((m) => !knownMessages.current!.has(m.id)) &&
        prefsRef.current.notifications
      ) {
        notify("💌 Hay una carta nueva.");
        say("¡Llegó una carta! La cuidé para ti.", "look-left");
        sound("letter");
      }
      knownMessages.current = new Set(next.messages.map((m) => m.id));
      setData(next);
      setError("");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [preview, profile.id, notify, say, sound]);
  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const raw = localStorage.getItem(`janny-prefs:${profile.id}`);
        if (raw)
          setPrefs({ ...defaultPrefs, ...JSON.parse(raw), music: false });
        if (preview) {
          const stored = localStorage.getItem("janny-local-preview-v1");
          const next: Snapshot = stored
            ? { ...emptySnapshot, ...JSON.parse(stored) }
            : { ...emptySnapshot, profiles: [profile] };
          if (!next.visits.some((v) => v.day === today())) {
            next.visits = [
              ...next.visits,
              { id: crypto.randomUUID(), owner_id: profile.id, day: today() },
            ];
            next.balance += 10;
          }
          if (active) {
            setData(next);
            setLoading(false);
          }
        } else {
          const { error } = await browserDb().rpc("record_visit");
          if (error) throw new Error(error.message);
          if (active) await refresh();
        }
      } catch (e) {
        if (active) {
          setError(friendlyError(e));
          setLoading(false);
        }
      }
    }
    void initialize();
    return () => {
      active = false;
      setAmbience(false);
    };
  }, [preview, profile, refresh]);
  useEffect(() => {
    if (!loading && preview && !error) {
      try {
        localStorage.setItem("janny-local-preview-v1", JSON.stringify(data));
      } catch {
        queueMicrotask(() =>
          notify("El navegador no pudo guardar esta prueba local."),
        );
      }
    }
  }, [data, preview, notify, loading, error]);
  useEffect(() => {
    if (preview) return;
    const db = browserDb();
    const channel = db
      .channel(`world:${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        void refresh();
      })
      .subscribe();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      void db.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [preview, profile.id, refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (character === "idle" || character === "sleepy") return;
    const timer = setTimeout(() => setCharacter("idle"), 3000);
    return () => clearTimeout(timer);
  }, [character]);
  const updatePrefs = useCallback(
    (patch: Partial<Preferences>) => {
      setPrefs((current) => {
        const next = { ...current, ...patch };
        try {
          localStorage.setItem(
            `janny-prefs:${profile.id}`,
            JSON.stringify(next),
          );
        } catch {}
        return next;
      });
      if (patch.music !== undefined) setAmbience(patch.music);
    },
    [profile.id],
  );
  const reward = useCallback(
    async (activity: string, reference?: string) => {
      if (preview) {
        const key = `reward:${activity}:${reference ?? (activity === "secret" ? "plant" : today())}`;
        setData((current) =>
          current.unlocks.some((u) => u.item === key)
            ? current
            : {
                ...current,
                balance: current.balance + 3,
                unlocks: [
                  ...current.unlocks,
                  {
                    id: crypto.randomUUID(),
                    owner_id: profile.id,
                    item: key,
                    created_at: new Date().toISOString(),
                  },
                ],
              },
        );
      } else {
        const { error } = await browserDb().rpc("reward_activity", {
          activity,
          reference_id: reference ?? null,
        });
        if (error) throw new Error(error.message);
        await refresh();
      }
    },
    [preview, profile.id, refresh],
  );
  const purchase = useCallback(
    async (id: string) => {
      const item = [...foods, ...shop].find((i) => i.id === id);
      if (!item) throw new Error("No encontré ese detalle.");
      if (preview) {
        if (data.balance < item.cost)
          throw new Error("Todavía faltan Nailocoins. No hay prisa.");
        if (data.unlocks.some((u) => u.item === id))
          throw new Error("Ya tienes ese detalle.");
        setData((current) => ({
          ...current,
          balance: current.balance - item.cost,
          unlocks: shop.some((s) => s.id === id)
            ? [
                ...current.unlocks,
                {
                  id: crypto.randomUUID(),
                  owner_id: profile.id,
                  item: id,
                  created_at: new Date().toISOString(),
                },
              ]
            : current.unlocks,
        }));
      } else {
        const { error } = await browserDb().rpc("purchase", { item_name: id });
        if (error) throw new Error(error.message);
        await refresh();
      }
      sound("unlock");
      notify(`${item.name} ya está aquí.`);
    },
    [data.balance, data.unlocks, preview, profile.id, refresh, sound, notify],
  );
  return (
    <Context.Provider
      value={{
        profile,
        preview,
        data,
        prefs,
        panel,
        character,
        speech,
        toast,
        error,
        loading,
        moodDraft,
        setMoodDraft,
        setPanel,
        setCharacter,
        say,
        notify,
        refresh,
        updatePrefs,
        sound,
        purchase,
        reward,
        localUpdate: setData,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorld() {
  const value = useContext(Context);
  if (!value) throw new Error("WorldProvider is required");
  return value;
}
