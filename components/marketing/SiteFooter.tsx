import Link from "next/link";
import { CONTACT_PHONE, WHATSAPP_URL } from "@/lib/site";
import { Logo } from "./Logo";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "./site-nav";

const linkClass =
  "rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Marketing footer. Only links to routes/sections that exist (no dead links). */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              {PRODUCT_TAGLINE}
            </p>
          </div>

          <nav aria-label="Producto" className="space-y-3 text-sm">
            <p className="font-semibold text-foreground">Producto</p>
            <ul className="space-y-2">
              <li>
                <Link
                  href={{ pathname: "/", hash: "plataforma" }}
                  className={linkClass}
                >
                  Plataforma
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/", hash: "como-funciona" }}
                  className={linkClass}
                >
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/", hash: "funciones" }}
                  className={linkClass}
                >
                  Funciones
                </Link>
              </li>
              <li>
                <Link href="/precios" className={linkClass}>
                  Precios
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Cuenta" className="space-y-3 text-sm">
            <p className="font-semibold text-foreground">Cuenta</p>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className={linkClass}>
                  Ingresar
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Contacto" className="space-y-3 text-sm">
            <p className="font-semibold text-foreground">Contacto</p>
            <ul className="space-y-2">
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
          </nav>
        </div>

        <div className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          © {year} {PRODUCT_NAME}. Hecho para negocios automotrices de Costa
          Rica.
        </div>
      </div>
    </footer>
  );
}
