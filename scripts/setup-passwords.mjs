// Run locally only. Never import this administrative script into the application.
import { randomInt } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {}
const words = [
  "Luna",
  "Mango",
  "Brisa",
  "Nube",
  "Rio",
  "Pera",
  "Sol",
  "Casa",
  "Lago",
  "Flor",
  "Gato",
  "Rosa",
  "Pino",
  "Miel",
  "Coco",
  "Mar",
  "Pato",
  "Lima",
  "Ola",
  "Pan",
  "Cielo",
  "Bosque",
  "Hoja",
  "Taza",
  "Fresa",
  "Trigo",
  "Zorro",
  "Campo",
  "Perla",
  "Rama",
  "Isla",
  "Faro",
  "Nieve",
  "Cereza",
  "Cedro",
  "Arce",
  "Palma",
  "Cobre",
  "Pluma",
  "Roca",
  "Piedra",
  "Nido",
  "Arena",
  "Cacao",
  "Canela",
  "Vela",
  "Balsa",
  "Duna",
  "Cometa",
  "Roble",
  "Tigre",
  "Bambu",
  "Avena",
  "Tren",
  "Barco",
  "Cisne",
  "Prado",
  "Puma",
  "Lirio",
  "Malva",
  "Sauce",
  "Viento",
  "Estrella",
  "Olivo",
];
const generate = () =>
  `${Array.from({ length: 4 }, () => words[randomInt(words.length)]).join("-")}-${randomInt(100000, 1000000)}!`;
if (process.argv.includes("--generate-only")) {
  console.log("Sugerencias nuevas; NO están asignadas a ninguna cuenta:");
  console.log(`Tavito: ${generate()}\nJanny: ${generate()}`);
  process.exit(0);
}
const url =
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "No se cambió ninguna contraseña. Configura la URL de Supabase y SUPABASE_SERVICE_ROLE_KEY en .env.local (archivo privado, excluido de Git). No uses una variable NEXT_PUBLIC para la clave secreta.",
  );
  process.exit(1);
}
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: profiles, error } = await db
  .from("profiles")
  .select("id,name,role")
  .in("role", ["gela", "janny"]);
if (error || profiles?.length !== 2) {
  console.error(
    "Se necesitan los dos perfiles existentes; no se crearon cuentas ni se cambió ningún acceso.",
  );
  process.exit(1);
}
const accounts = [];
for (const profile of profiles) {
  const { data, error } = await db.auth.admin.getUserById(profile.id);
  if (error || !data.user?.email) {
    console.error(
      "No se pudo resolver una de las cuentas. No se cambió ninguna contraseña.",
    );
    process.exit(1);
  }
  accounts.push({ profile, email: data.user.email });
}
const input = createInterface({ input: stdin, output: stdout });
try {
  console.log("Se asignarán contraseñas nuevas a estas cuentas existentes:");
  accounts.forEach(({ profile, email }) =>
    console.log(`${profile.name} (${profile.role}): ${email}`),
  );
  const answer = await input.question("Escribe ACTUALIZAR para continuar: ");
  if (answer !== "ACTUALIZAR") {
    console.log("Cancelado, sin cambios.");
    process.exitCode = 0;
  } else {
    for (const { profile, email } of accounts) {
      const password = generate();
      const { error } = await db.auth.admin.updateUserById(profile.id, {
        password,
      });
      if (error) {
        console.error(
          `No se cambió la contraseña de ${email}. Revisa la política de contraseñas de Supabase.`,
        );
        process.exitCode = 1;
        continue;
      }
      console.log(`\nContraseña asignada a ${email}: ${password}`);
    }
    console.log(
      "\nGuárdalas en un gestor de contraseñas. Este script no las escribe en archivos.",
    );
  }
} finally {
  input.close();
}
