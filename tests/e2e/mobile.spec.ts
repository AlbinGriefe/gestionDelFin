import { expect, test } from "@playwright/test";

test("Play and login remain usable on mobile", async ({ page }) => {
  await page.goto("/play");
  await expect(
    page.getByRole("heading", { name: /decisiones claras/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: /acceder al sistema/i }).click();
  await expect(
    page.getByRole("heading", { name: /acceso al centro/i }),
  ).toBeVisible();
  await expect(page.getByLabel(/usuario/i)).toBeVisible();
});
