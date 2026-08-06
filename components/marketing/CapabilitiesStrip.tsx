import { QrCode, ClipboardCheck, Gift, Globe, Zap, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Marquee } from "@/components/motion/Marquee";

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
  {
    icon: Zap,
    title: "Escaneo en segundos",
    text: "QR o token, desde cualquier cámara.",
  },
  {
    icon: Users,
    title: "Multiempresa",
    text: "Datos separados por negocio.",
  },
];

export function CapabilitiesStrip() {
  return (
    <section className="border-b bg-card py-10">
      <Marquee
        pauseOnHover
        className="mx-auto max-w-6xl [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="flex w-72 shrink-0 items-start gap-3.5 rounded-2xl border bg-background/60 p-5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          </div>
        ))}
      </Marquee>
    </section>
  );
}
