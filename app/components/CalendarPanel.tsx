import { CalendarHeart } from "lucide-react";
import { useWorld } from "@/lib/world-store";
import { prettyDate } from "@/lib/constants";
export default function CalendarPanel() {
  const { data } = useWorld();
  const year = new Date().getFullYear();
  const annual = [
    {
      title: "Día de Muertos",
      day: `${year}-11-02`,
      body: "Un lugar para recordar con cariño.",
    },
    {
      title: "Navidad",
      day: `${year}-12-25`,
      body: "Hoy la habitación se viste de luz.",
    },
    {
      title: "Año Nuevo",
      day: `${year}-01-01`,
      body: "Otro comienzo, a nuestro ritmo.",
    },
    {
      title: "San Valentín",
      day: `${year}-02-14`,
      body: "Qué bonito coincidir.",
    },
  ];
  return (
    <>
      <p className="muted">Hay días que tienen un lugar especial aquí.</p>
      <div className="event-list">
        {[...data.events, ...annual]
          .sort((a, b) => a.day.slice(5).localeCompare(b.day.slice(5)))
          .map((event, i) => (
            <article key={i}>
              <div className="event-date">
                <strong>{event.day.slice(8)}</strong>
                <span>
                  {new Date(event.day + "T12:00:00").toLocaleDateString(
                    "es-MX",
                    { month: "short" },
                  )}
                </span>
              </div>
              <div>
                <h3>{event.title}</h3>
                <p>{event.body}</p>
                <small>
                  {"annual" in event && event.annual
                    ? "Cada año"
                    : prettyDate(event.day)}
                </small>
              </div>
              <CalendarHeart size={18} />
            </article>
          ))}
      </div>
    </>
  );
}
