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
import {
  loadSnapshot,
  friendlyError,
  snapshotTables,
  type SnapshotTable,
} from "./data";
import { useCharacter } from "./world/use-character";
import { usePreferences } from "./world/use-preferences";
import { useConversation } from "./world/use-conversation";
import {
  emptySnapshot,
  type Snapshot,
  type Preferences,
  type Profile,
  type CharacterState,
  type Panel,
} from "./types";
import { foods, shop, today } from "./constants";
type World = {
  profile: Profile;
  preview: boolean;
  data: Snapshot;
  prefs: Preferences;
  panel: Panel;
  character: CharacterState;
  speech: string;
  treat: { icon: string; id: number } | null;
  feed: (icon: string) => void;
  toast: string;
  error: string;
  loading: boolean;
  dataReady: boolean;
  moodDraft: number | null;
  setMoodDraft: (m: number | null) => void;
  setPanel: (p: Panel) => void;
  setCharacter: (s: CharacterState) => void;
  say: (s: string, c?: CharacterState) => void;
  notify: (s: string) => void;
  refresh: (tables?: SnapshotTable[]) => Promise<boolean>;
  conversation: ReturnType<typeof useConversation>;
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
  ephemeral = false,
}: {
  children: ReactNode;
  profile: Profile;
  preview: boolean;
  ephemeral?: boolean;
}) {
  const [moodDraft, setMoodDraft] = useState<number | null>(null);
  const [data, setData] = useState<Snapshot>(emptySnapshot);
  const [panel, setPanel] = useState<Panel>(null);
  const { character, speech, toast, treat, feed, setCharacter, notify, say } =
    useCharacter();
  const { prefs, prefsRef, updatePrefs, sound } = usePreferences(
    profile.id,
    ephemeral,
    notify,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const versions = useRef(new Map<string, number>());
  const incoming = useCallback(() => {
    if (!prefsRef.current.notifications) return;
    notify("💌 Hay una carta nueva.");
    say("¡Llegó una carta! La cuidé para ti.", "look-left");
    sound("letter");
  }, [prefsRef, notify, say, sound]);
  const conversation = useConversation(profile.id, preview, incoming);
  const refreshMessages = conversation.refresh;
  const refresh = useCallback(
    async (tables?: SnapshotTable[]) => {
      if (preview) return true;
      const selected = tables ?? [...snapshotTables];
      const requestVersions = new Map(
        selected.map((table) => {
          const version = (versions.current.get(table) ?? 0) + 1;
          versions.current.set(table, version);
          return [table, version] as const;
        }),
      );
      try {
        const [next, messagesOk] = await Promise.all([
          loadSnapshot(selected),
          tables ? Promise.resolve(true) : refreshMessages(),
        ]);
        setData((current) => {
          const patch: Partial<Snapshot> = {};
          selected.forEach((table) => {
            const field = table === "coins" ? "balance" : table;
            if (versions.current.get(table) === requestVersions.get(table))
              Object.assign(patch, { [field]: next[field] });
          });
          return { ...current, ...patch };
        });
        setError("");
        if (!tables) setDataReady(true);
        return messagesOk;
      } catch (e) {
        setError(friendlyError(e));
        return false;
      } finally {
        if (!tables) setLoading(false);
      }
    },
    [preview, refreshMessages],
  );
  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        if (preview) {
          const stored = ephemeral
            ? null
            : localStorage.getItem("janny-local-preview-v1");
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
            setDataReady(true);
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
    };
  }, [preview, profile, refresh, ephemeral]);
  useEffect(() => {
    if (!loading && preview && !error && !ephemeral) {
      try {
        localStorage.setItem("janny-local-preview-v1", JSON.stringify(data));
      } catch {
        queueMicrotask(() =>
          notify("El navegador no pudo guardar esta prueba local."),
        );
      }
    }
  }, [data, preview, notify, loading, error, ephemeral]);
  useEffect(() => {
    if (preview) return;
    const db = browserDb();
    let channel = db.channel(`world:${profile.id}`);
    for (const table of snapshotTables) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          void refresh([table]);
        },
      );
    }
    channel.subscribe();
    // Scheduled letters have no database update when their availability time arrives.
    const sync = () => {
      if (document.visibilityState === "visible")
        void refresh(["open_when", "notifications"]);
    };
    const timer = setInterval(sync, 60000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      void db.removeChannel(channel);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [preview, profile.id, refresh]);
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
        await refresh(["coins", "unlocks"]);
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
        await refresh(["coins", "unlocks"]);
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
        data: { ...data, messages: conversation.messages },
        conversation,
        prefs,
        panel,
        character,
        speech,
        treat,
        feed,
        toast,
        error: error || conversation.error,
        loading,
        dataReady,
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
