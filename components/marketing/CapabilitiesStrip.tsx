import { QrCode, ClipboardCheck, Gift, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: QrCode,
    title: "Registro digital",
    text: "El cliente se registra desde su teléfono.",
  },
  {
    icon: ClipboardCheck,
    title: "Visitas controladas",
    text: "Cada movimiento queda registrado.",
  },
  {
    icon: Gift,
    title: "Recompensas automáticas",
    text: "El sistema calcula el progreso.",
  },
  {
    icon: Globe,
    title: "Sin app",
    text: "Todo funciona desde el navegador.",
  },
];

export function CapabilitiesStrip() {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden bg-border px-0 sm:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-card p-6">
            <Icon className="h-5 w-5 text-primary" aria-hidden />
            <p className="mt-3 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
