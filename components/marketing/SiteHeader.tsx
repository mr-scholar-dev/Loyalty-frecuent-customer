"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "./Logo";
import { NAV_ITEMS, PRODUCT_NAME } from "./site-nav";

function NavLink({
  item,
  onClick,
  className,
}: {
  item: (typeof NAV_ITEMS)[number];
  onClick?: () => void;
  className?: string;
}) {
  const base = cn(
    "rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className,
  );
  if (item.route) {
    return (
      <Link href={item.route} onClick={onClick} className={base}>
        {item.label}
      </Link>
    );
  }
  return (
    <Link
      href={{ pathname: "/", hash: item.hash }}
      onClick={onClick}
      className={base}
    >
      {item.label}
    </Link>
  );
}

/** Sticky marketing header. Both essential actions (Ingresar + Solicitar demo)
 * stay reachable on mobile: "Solicitar demo" is always visible and "Ingresar"
 * lives one tap away inside the menu. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Lock body scroll + close on Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`${PRODUCT_NAME} — inicio`}
        >
          <Logo />
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-7 lg:flex"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Ingresar
          </Link>
          <Link
            href="/registro"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Crear cuenta
          </Link>

          {/* Mobile: keep the primary action visible + a menu for the rest. */}
          <Link
            href="/registro"
            className={cn(buttonVariants({ size: "sm" }), "sm:hidden")}
          >
            Crear cuenta
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-border/70 bg-background lg:hidden"
        >
          <nav
            aria-label="Menú móvil"
            className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.label}
                item={item}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-accent"
              />
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 w-full",
              )}
            >
              Ingresar
            </Link>
            <Link
              href="/registro"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants(), "w-full")}
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
