import { expect, test } from "@playwright/test";

test.describe("marketing smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /entrar na kraken/i })).toBeVisible();
  });

  test("unauthenticated dashboard redirects to login", async ({ page }) => {
    await page.goto("/home");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });
});
