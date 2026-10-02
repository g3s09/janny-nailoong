"use client";
import { House, Mail, Images, Settings2 } from "lucide-react";
import UnreadBadge from "./UnreadBadge";
export default function AppNavigation({
  active,
  onChoose,
  unread = 0,
  embedded = false,
}: {
  active: string;
  onChoose: (section: string) => void;
  unread?: number;
  embedded?: boolean;
}) {
  const items = [
    { id: "home", label: "Inicio", icon: House },
    { id: "mail", label: "Mensajes", icon: Mail },
    { id: "memories", label: "Recuerdos", icon: Images },
    { id: "settings", label: "Ajustes", icon: Settings2 },
  ];
  return (
    <nav
      className={`app-navigation ${embedded ? "is-embedded" : ""}`}
      aria-label="Navegación principal"
    >
      {items.map(({ id, label, icon: Icon }) => (
        <button
          type="button"
          key={id}
          aria-current={active === id ? "page" : undefined}
          onClick={() => onChoose(id)}
        >
          <span className="nav-symbol">
            <Icon size={20} />
            {id === "mail" && <UnreadBadge count={unread} />}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
