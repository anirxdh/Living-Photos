import { expect, test } from "@playwright/test";

test.describe("Smoke", () => {
  test("home page renders the hero with CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Step inside a memory.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Bring a memory to life/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /My memories/i })).toBeVisible();
  });

  test("/api/health returns ok with mockMode flag", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { status: string; mockMode: boolean };
    expect(json.status).toBe("ok");
    expect(json.mockMode).toBe(true);
  });
});
