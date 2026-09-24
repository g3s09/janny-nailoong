"use client";
import { useWorld } from "@/lib/world-store";
export default function PersonalTouches({
  onChoose,
}: {
  onChoose: (tab: string) => void;
}) {
  const { data } = useWorld();
  const steps = [
    {
      tab: "memories",
      title: "Nuestra primera foto",
      description: "Un momento real, aunque sea de un día cualquiera.",
      done: data.memories.some((m) => m.attachment),
    },
    {
      tab: "memories",
      title: "Un audio para Janny",
      description: "Puedes adjuntar una grabación a un recuerdo.",
      done: data.memories.some((m) => m.audio),
    },
    {
      tab: "events",
      title: "Una fecha nuestra",
      description: "Un cumpleaños, un encuentro o algo que quieran celebrar.",
      done: data.events.length > 0,
    },
    {
      tab: "open_when",
      title: "Un sobre para después",
      description: "Para cuando necesite reír, compañía o una palabra bonita.",
      done: data.open_when.length > 0,
    },
  ];
  return (
    <details className="personal-touches">
      <summary>
        Mis detalles para Janny · {steps.filter((s) => s.done).length} de 4
        detalles
      </summary>
      <div>
        {steps.map((s) => (
          <button type="button" key={s.title} onClick={() => onChoose(s.tab)}>
            <span aria-hidden="true">{s.done ? "✓" : "♡"}</span>
            <strong>{s.title}</strong>
            <small>{s.description}</small>
          </button>
        ))}
      </div>

    </details>
  );
}
