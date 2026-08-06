import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import { WHATSAPP_URL } from "@/lib/site";

/**
 * Landing (marketing) tests: guard the public entry point — a single H1, the
 * essential links, in-page anchors that actually exist, and that the WhatsApp
 * CTA uses the shared constant. No business logic is exercised here.
 */
describe("landing page", () => {
  it("renders exactly one h1 with the marketing headline", () => {
    render(<HomePage />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(
      "Convierte cada visita en un cliente recurrente.",
    );
  });

  it("links 'Ingresar' to /login", () => {
    render(<HomePage />);
    const links = screen.getAllByRole("link", { name: "Ingresar" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/login");
    }
  });

  it("links 'Precios' to /precios", () => {
    render(<HomePage />);
    const links = screen.getAllByRole("link", { name: "Precios" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/precios");
    }
  });

  it("points the demo CTA at the shared WhatsApp URL", () => {
    render(<HomePage />);
    const demo = screen.getAllByRole("link", { name: /solicitar una demo/i });
    expect(demo.length).toBeGreaterThan(0);
    for (const link of demo) {
      expect(link).toHaveAttribute("href", WHATSAPP_URL);
    }
  });

  it("uses a wa.me checkout message for the pricing CTA", async () => {
    const { PricingCards } =
      await import("@/components/marketing/PricingCards");
    render(<PricingCards />);
    const buy = screen.getByRole("link", { name: "Comprar Plan" });
    expect(buy).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/"),
    );
    expect(buy).toHaveAttribute(
      "href",
      expect.stringContaining("%C2%BFCu%C3%A1les"),
    );
  });

  it("exposes navigation anchors that map to existing sections", () => {
    const { container } = render(<HomePage />);
    for (const id of ["plataforma", "como-funciona", "funciones", "faq"]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it("renders the pricing preview and FAQ content", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Un plan simple para comenzar." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("¿El cliente debe instalar una aplicación?"),
    ).toBeInTheDocument();
  });
});
