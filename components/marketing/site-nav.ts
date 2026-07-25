/** Shared marketing nav model, reused by the header and footer. */

export const PRODUCT_NAME = "Loyalty Web";
export const PRODUCT_TAGLINE =
  "Plataforma de fidelización, retención y control de clientes para negocios automotrices.";

export interface NavItem {
  label: string;
  /** In-page section anchor (rendered as a hash link to "/"). */
  hash?: string;
  /** A real route (only /precios today). */
  route?: "/precios";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Plataforma", hash: "plataforma" },
  { label: "Cómo funciona", hash: "como-funciona" },
  { label: "Funciones", hash: "funciones" },
  { label: "Precios", route: "/precios" },
  { label: "Preguntas frecuentes", hash: "faq" },
];
