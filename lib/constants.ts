export const moods = [
  {
    face: "😄",
    label: "Muy bien",
    response: "Esa sonrisa combina con todo este lugar.",
  },
  {
    face: "🙂",
    label: "Bien",
    response: "Un día tranquilo también es un buen día.",
  },
  {
    face: "😐",
    label: "Más o menos",
    response: "Podemos quedarnos aquí un ratito. Sin prisa.",
  },
  {
    face: "😞",
    label: "Triste",
    response: "Hoy podemos ir despacio. Te hago un lugar a mi lado.",
  },
  {
    face: "😡",
    label: "Con enojo",
    response: "Te escucho. Hasta guardé las cucharas para no hacer ruido.",
  },
  {
    face: "🥺",
    label: "Sensible",
    response: "No tienes que poder con todo hoy. Aquí cabes tal como estás.",
  },
  {
    face: "😴",
    label: "Con sueño",
    response: "Descansar también cuenta. Soy un experto en eso.",
  },
];
export const welcomeLetter = `Janny,

Hice todo esto pensando en ti. Quería darte algo que pudieras abrir cuando se te antojara y decir: «esto me lo hizo Gela» jsjs.

Escríbeme lo que quieras. Cómo te fue, algo que te dio risa, algo que traes en la cabeza… me gusta saber de ti. No tiene que ser una carta enorme; con un hola tuyo ya me da gusto.

También quiero que guardemos fotos y cosas nuestras. Y en los sobres te iré dejando palabras para esos días en los que quisiera estar ahí y darte un abrazo.

Te traje a Nailoong para que te haga compañía. Cuídalo, pero aguas: te va a pedir galletas como si no hubiera comido en tres días.

Ojalá te guste, Janny. Le puse mucho cariño porque te quiero mucho.

Gela.
Tu Gus Gus ♡`;
export const foods = [
  { id: "cookie", name: "Galleta", icon: "🍪", cost: 3 },
  { id: "fruit", name: "Frutita", icon: "🍓", cost: 4 },
  { id: "pizza", name: "Pizza", icon: "🍕", cost: 6 },
  { id: "cake", name: "Pastel", icon: "🍰", cost: 7 },
  { id: "ramen", name: "Ramen", icon: "🍜", cost: 8 },
  { id: "dumpling", name: "Dumplings", icon: "🥟", cost: 6 },
];
export const shop = [
  { id: "scarf", name: "Una bufanda", icon: "🧣", cost: 20, kind: "accessory" },
  {
    id: "flower",
    name: "Una florecita",
    icon: "🌼",
    cost: 15,
    kind: "accessory",
  },
  { id: "kitchen", name: "La cocina", icon: "🍳", cost: 25, kind: "room" },
  { id: "garden", name: "El jardín", icon: "🌿", cost: 35, kind: "room" },
  { id: "roof", name: "La azotea", icon: "🌙", cost: 45, kind: "room" },
  { id: "space", name: "Entre estrellas", icon: "🪐", cost: 60, kind: "room" },
];
export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function prettyDate(value: string, time = false) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    ...(time
      ? ({ hour: "2-digit", minute: "2-digit" } as const)
      : ({ year: "numeric" } as const)),
  }).format(new Date(value.length === 10 ? value + "T12:00:00" : value));
}
export function streak(days: string[]) {
  const set = new Set(days);
  const date = new Date();
  let count = 0;
  for (let i = 0; i < 36600; i++) {
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (!set.has(day)) break;
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}
