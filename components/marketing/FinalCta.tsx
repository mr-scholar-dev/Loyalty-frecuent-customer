import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WHATSAPP_URL } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";

export function FinalCta() {
  return (
    <section className="bg-surface-dark py-20 text-surface-dark-foreground sm:py-28">
      <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Empieza a convertir visitas en relaciones duraderas.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-surface-dark-foreground/70">
          Configura tu programa digital y administra clientes, visitas y
          recompensas desde una sola plataforma.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "shimmer w-full sm:w-auto",
            )}
          >
            Solicitar una demo
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full border-white/25 bg-transparent text-surface-dark-foreground hover:bg-white/10 hover:text-surface-dark-foreground sm:w-auto",
            )}
          >
            <MessageCircle aria-hidden />
            Hablar por WhatsApp
          </a>
        </div>
      </Reveal>
    </section>
  );
}
