import { expect, test } from "@playwright/test";

/**
 * Phase 0 E2E smoke test. Verifies the app boots and the health endpoint
 * responds. No business flows yet (added in later phases).
 */
test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Plataforma de fidelización para servicentros/i,
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
