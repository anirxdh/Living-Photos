import { expect, test } from "@playwright/test";

test.describe("Smoke", () => {
  test("home page renders the hero with CTAs", async ({ page }) => {
    await page.goto("/");
    // Hero headline split across two spans; just assert the first half is visible
    await expect(page.getByRole("heading", { name: /Step inside/i })).toBeVisible();
    // Multiple "Bring a memory to life" links exist (nav, hero, pricing, CTA, footer)
    await expect(page.getByRole("link", { name: /Bring a memory to life/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /My memories/i }).first()).toBeVisible();
  });

  test("/api/health returns ok with mockMode flag", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { status: string; mockMode: boolean };
    expect(json.status).toBe("ok");
    expect(json.mockMode).toBe(true);
  });
});
