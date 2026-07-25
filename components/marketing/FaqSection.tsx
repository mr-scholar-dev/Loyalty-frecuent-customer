import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "¿El cliente debe instalar una aplicación?",
    a: "No. Recibe una tarjeta digital como página web con su código QR; no necesita descargar nada.",
  },
  {
    q: "¿Cómo guarda el cliente su tarjeta?",
    a: "Es una página web con una dirección propia. El cliente puede guardarla en favoritos o agregarla a la pantalla de inicio de su teléfono.",
  },
  {
    q: "¿Qué ocurre cuando alcanza la recompensa?",
    a: "El sistema genera la recompensa automáticamente al completar el ciclo; tu equipo la canjea al escanear la tarjeta del cliente.",
  },
  {
    q: "¿Puede usarlo más de un empleado?",
    a: "Sí. Puedes agregar a tu equipo y asignar roles según lo que cada persona debe poder hacer.",
  },
  {
    q: "¿Puedo cambiar la cantidad de visitas requeridas?",
    a: "Sí. Defines la regla del programa; por defecto son 9 lavados pagados para obtener 1 gratis.",
  },
  {
    q: "¿Los datos de otros negocios se mezclan con los míos?",
    a: "No. Cada negocio está aislado y solo tiene acceso a su propia información.",
  },
  {
    q: "¿Funciona en celulares y computadoras?",
    a: "Sí. Todo funciona desde el navegador, tanto en teléfonos como en computadoras.",
  },
  {
    q: "¿Necesito equipo especial para escanear?",
    a: "No. Tu equipo escanea con la cámara de un teléfono o computadora; no se requiere hardware adicional.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-b py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Lo que suelen preguntar
          </h2>
        </div>

        <div className="mt-10 divide-y divide-border rounded-2xl border bg-card">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group px-5 py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {q}
                <Plus
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="pb-4 pr-8 text-sm leading-relaxed text-muted-foreground">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
