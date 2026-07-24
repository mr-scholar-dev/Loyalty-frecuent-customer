import Link from "next/link";
import { Droplets } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Sticky marketing header shared by the public landing + pricing pages. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Droplets className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            Loyalty Web
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <Link
            href={{ pathname: "/", hash: "features" }}
            className="transition-colors hover:text-foreground"
          >
            Características
          </Link>
          <Link
            href={{ pathname: "/", hash: "how" }}
            className="transition-colors hover:text-foreground"
          >
            Cómo funciona
          </Link>
          <Link
            href="/precios"
            className="transition-colors hover:text-foreground"
          >
            Precios
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Ingresar
          </Link>
          <Link href="/precios" className={cn(buttonVariants({ size: "sm" }))}>
            Empezar
          </Link>
        </div>
      </div>
    </header>
  );
}
