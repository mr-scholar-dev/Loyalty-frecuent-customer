import Link from "next/link";
import { Droplets } from "lucide-react";
import { CONTACT_PHONE, WHATSAPP_URL } from "@/lib/site";

const linkClass = "hover:text-foreground";

/** Marketing footer shared by the public landing + pricing pages. */
export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Droplets className="h-4 w-4" aria-hidden />
              </span>
              <span className="font-semibold">Loyalty Web</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Fidelización digital para servicentros. Tarjetas con QR, lavados y
              recompensas — sin app que instalar.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Producto</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={{ pathname: "/", hash: "features" }}
                  className={linkClass}
                >
                  Características
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/", hash: "how" }}
                  className={linkClass}
                >
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link href="/precios" className={linkClass}>
                  Precios
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Cuenta</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className={linkClass}>
                  Ingresar
                </Link>
              </li>
              <li>
                <Link href="/el-sol" className={linkClass}>
                  Ver demo
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Contacto</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={linkClass}
                >
                  WhatsApp {CONTACT_PHONE}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          © 2026 Loyalty Web. Hecho para servicentros de Costa Rica.
        </div>
      </div>
    </footer>
  );
}
