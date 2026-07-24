import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { PricingCards } from "@/components/marketing/PricingCards";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Planes de Loyalty Web para servicentros: Gratis, Pro y Empresa. Empieza gratis y crece cuando lo necesites.",
};

const faqs = [
  {
    q: "¿Necesito instalar una app?",
    a: "No. Tus clientes reciben una tarjeta digital como página web con su QR; la guardan en el teléfono. Tu personal opera desde el navegador.",
  },
  {
    q: "¿Puedo cambiar de plan cuando quiera?",
    a: "Sí. Puedes empezar en Gratis y pasar a Pro o Empresa en cualquier momento, sin perder tus datos.",
  },
  {
    q: "¿Los datos de mi servicentro están seguros?",
    a: "Sí. Cada organización está aislada a nivel de base de datos (RLS), con roles por empleado y auditoría de cada movimiento.",
  },
  {
    q: "¿Cómo defino la promoción?",
    a: "Tú configuras la regla (por ejemplo, 9 lavados pagados = 1 gratis). El sistema genera y controla la recompensa automáticamente.",
  },
  {
    q: "¿Cómo empiezo?",
    a: "Escríbenos y montamos tu servicentro (colores, sucursal y programa) el mismo día. También puedes ver la demo en vivo.",
  },
];

export default function PreciosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight">
                Precios que crecen contigo
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Sin contratos complicados. Empieza gratis y actualiza cuando tu
                servicentro lo necesite.
              </p>
            </div>
            <div className="mt-12">
              <PricingCards />
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Precios en colones (₡), por servicentro, IVA no incluido. El plan
              del SaaS se activa al pasar a producción.
            </p>
          </div>
        </section>

        <section className="border-t bg-muted/20 py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight">
              Preguntas frecuentes
            </h2>
            <dl className="mt-10 space-y-6">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-xl border bg-card p-5">
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-1.5 text-sm text-muted-foreground">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
