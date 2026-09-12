export type CharacterState =
  | "idle"
  | "walk"
  | "hello"
  | "wave"
  | "happy"
  | "thinking"
  | "surprised"
  | "sleepy"
  | "sad"
  | "laugh"
  | "eat"
  | "jump"
  | "fall"
  | "sit"
  | "hug"
  | "look-left"
  | "look-right"
  | "blink";
export type Panel =
  | "mail"
  | "memories"
  | "diary"
  | "box"
  | "calendar"
  | "care"
  | "settings"
  | "letter"
  | null;
export type Profile = { id: string; name: string; role: "janny" | "gela" };
export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  attachment: string | null;
  attachment_type: string | null;
  important: boolean;
  created_at: string;
  deliver_at: string;
  read_at: string | null;
};
export type Memory = {
  id: string;
  owner_id: string;
  title: string;
  body: string;
  date: string;
  place: string;
  attachment: string | null;
  audio: string | null;
};
export type Mood = {
  id: string;
  owner_id: string;
  day: string;
  mood: number;
  note: string;
};
export type Letter = {
  id: string;
  owner_id: string;
  title: string;
  body: string;
  attachment: string | null;
  audio: string | null;
  once: boolean;
  opened_at: string | null;
  available_at: string;
};
export type CalendarEvent = {
  id: string;
  owner_id: string;
  title: string;
  body: string;
  day: string;
  annual: boolean;
  decoration: string;
};
export type Unlock = {
  id: string;
  owner_id: string;
  item: string;
  created_at: string;
};
export type Visit = { id: string; owner_id: string; day: string };
export type Notice = {
  id: string;
  owner_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};
export type Phrase = { id: string; body: string; state: CharacterState };
export type Snapshot = {
  profiles: Profile[];
  messages: Message[];
  memories: Memory[];
  moods: Mood[];
  open_when: Letter[];
  events: CalendarEvent[];
  unlocks: Unlock[];
  visits: Visit[];
  notifications: Notice[];
  phrases: Phrase[];
  balance: number;
};
export type Preferences = {
  music: boolean;
  effects: boolean;
  haptics: boolean;
  night: boolean | null;
  room: string;
  accessory: string;
  notifications: boolean;
};
export const emptySnapshot: Snapshot = {
  profiles: [],
  messages: [],
  memories: [],
  moods: [],
  open_when: [],
  events: [],
  unlocks: [],
  visits: [],
  notifications: [],
  phrases: [],
  balance: 0,
};
