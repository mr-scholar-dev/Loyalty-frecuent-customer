const STEPS = [
  {
    title: "Publica tu QR de registro",
    text: "Colócalo en caja, recepción o en tus canales digitales.",
  },
  {
    title: "El cliente crea su tarjeta",
    text: "Se registra desde el navegador y recibe su QR personal.",
  },
  {
    title: "Registra visitas y entrega recompensas",
    text: "Tu equipo escanea, registra y consulta el progreso en segundos.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 border-b bg-muted/40 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            Puesta en marcha
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-3 text-muted-foreground">
            En marcha en minutos, sin instalar nada ni comprar hardware
            especial.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-10 md:grid-cols-3">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
          />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background font-mono text-sm font-bold text-primary">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
