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
      body: "Hoy quiero recordar contigo a quienes extrañamos.",
    },
    {
      title: "Navidad",
      day: `${year}-12-25`,
      body: "Quería desearte una bonita Navidad, Janny. Te mando un abrazo.",
    },
    {
      title: "Año Nuevo",
      day: `${year}-01-01`,
      body: "Quiero seguir compartiendo cosas contigo este año.",
    },
    {
      title: "San Valentín",
      day: `${year}-02-14`,
      body: "Me da mucho gusto haberte encontrado, Janny.",
    },
  ];
  return (
    <>
      <p className="muted">Aquí quiero ir guardando las fechas que no se me deben olvidar contigo jsjs.</p>
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
