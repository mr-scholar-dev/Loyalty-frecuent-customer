import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { PricingCards } from "@/components/marketing/PricingCards";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Planes de Loyalty Web para servicentros: Pro (US$65/mes o US$54/mes anual) y Empresa. Comunícate para activar tu cuenta.",
};

const faqs = [
  {
    q: "¿Cuánto cuesta?",
    a: "El plan Pro cuesta US$65 al mes por servicentro, o US$54/mes si pagas anual. Empresa es a medida para cadenas o marca blanca.",
  },
  {
    q: "¿Qué incluye la IA?",
    a: "Un copiloto que consulta tu negocio en lenguaje natural, detecta clientes en riesgo, redacta mensajes de reactivación por WhatsApp y hasta crea tareas en tu tablero Kanban.",
  },
  {
    q: "¿Cómo empiezo?",
    a: "Escríbenos por WhatsApp al +506 6151 1306. Te indicamos el método de pago según tu país y activamos manualmente tu servicentro después de validar el comprobante.",
  },
  {
    q: "¿Cómo se paga?",
    a: "Si estás en Costa Rica, puedes pagar por SINPE Móvil. Si estás fuera del país, te compartimos PayPal.Me o una billetera de USDT. Envía el comprobante por WhatsApp y activamos tu cuenta manualmente.",
  },
  {
    q: "¿Necesito instalar una app?",
    a: "No. Tus clientes reciben una tarjeta digital como página web con su QR; la guardan en el teléfono. Tu personal opera desde el navegador.",
  },
  {
    q: "¿Los datos de mi servicentro están seguros?",
    a: "Sí. Cada organización está aislada a nivel de base de datos (RLS), con roles por empleado y auditoría de cada movimiento.",
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
                Un solo plan, todo incluido. Sin sorpresas. Actívalo cuando tu
                servicentro esté listo.
              </p>
            </div>
            <div className="mt-12">
              <PricingCards />
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Precio en dólares (USD), por servicentro. Para comprar, escríbenos
              por WhatsApp; te compartiremos el método de pago disponible y
              activaremos tu cuenta al validar el comprobante.
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
