import { expect, test } from "@playwright/test";

/**
 * Public marketing landing smoke + a basic flow. No business/dashboard flows.
 */
test("landing renders the marketing headline", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Convierte cada visita en un cliente recurrente/i,
    }),
  ).toBeVisible();
});

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(body.service).toBe("loyalty-web");
});

test("navigate to 'Cómo funciona', open a FAQ, and reach the demo CTA", async ({
  page,
}) => {
  await page.goto("/");

  // In-page navigation to the "how it works" section.
  await page.getByRole("link", { name: "Cómo funciona" }).first().click();
  await expect(page.locator("#como-funciona")).toBeVisible();

  // FAQ accordion (native <details>) opens.
  await page.getByText("¿El cliente debe instalar una aplicación?").click();
  await expect(
    page.getByText(/Recibe una tarjeta digital como página web/i),
  ).toBeVisible();

  // Primary demo CTA is present and points to WhatsApp.
  const demo = page.getByRole("link", { name: /solicitar una demo/i }).first();
  await expect(demo).toHaveAttribute("href", /whatsapp/i);
});

test("mobile viewport has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
