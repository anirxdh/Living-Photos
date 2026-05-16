import { expect, test } from "@playwright/test";

test.describe("Full flow (MOCK_MODE)", () => {
  test("user can upload, see generating, unlock, and reach a viewer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Bring a memory to life/i }).click();
    await expect(page).toHaveURL(/\/create$/);

    // Fill title
    await page.getByTestId("title-input").fill("Grandma's kitchen");
    await page.getByTestId("description-input").fill("She used to bake here every Sunday.");

    // Upload a tiny in-memory file
    const buffer = Buffer.from("fake-jpeg-bytes");
    await page.getByTestId("file-input").setInputFiles({
      name: "test.jpg",
      mimeType: "image/jpeg",
      buffer,
    });

    await expect(page.getByTestId("submit-button")).toBeEnabled();
    await page.getByTestId("submit-button").click();

    // Should navigate to /scene/[slug]
    await expect(page).toHaveURL(/\/scene\/[a-z0-9]{12}$/);
    await expect(page.getByRole("heading", { name: "Grandma's kitchen" })).toBeVisible();
    // Mock pipeline runs in <1s; should arrive at the unlock CTA
    await expect(page.getByRole("button", { name: /Unlock memory/ })).toBeVisible();
  });

  test("dashboard lists scenes after creation", async ({ page }) => {
    // Unique title because dev-server in-memory store is shared across test runs.
    const title = `Seed scene ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const res = await page.request.post("/api/scenes", {
      data: { sourcePhotoUrl: "https://example.test/seed.jpg", title },
    });
    expect(res.status()).toBe(201);

    await page.goto("/dashboard");
    await expect(page.getByText(title)).toBeVisible();
  });
});

test.describe("API smoke", () => {
  test("can post to /api/scenes and read back", async ({ request }) => {
    const create = await request.post("/api/scenes", {
      data: { sourcePhotoUrl: "https://example.test/x.jpg", title: "API test" },
    });
    expect(create.status()).toBe(201);
    const { scene } = (await create.json()) as { scene: { id: string; slug: string } };

    const get = await request.get(`/api/scenes/${scene.id}`);
    expect(get.status()).toBe(200);
  });

  test("rejects bad scene payload", async ({ request }) => {
    const r = await request.post("/api/scenes", { data: { sourcePhotoUrl: "not a url" } });
    expect(r.status()).toBe(400);
  });

  test("voice consent draft includes nonce and name", async ({ request }) => {
    const r = await request.get("/api/voice/consent?name=Maria");
    const j = (await r.json()) as { nonce: string; phrase: string };
    expect(j.nonce).toMatch(/^[A-Z0-9]{6}$/);
    expect(j.phrase).toContain("Maria");
    expect(j.phrase).toContain(j.nonce);
  });

  test("checkout returns mock URL containing scene_id", async ({ request }) => {
    const create = await request.post("/api/scenes", {
      data: { sourcePhotoUrl: "https://example.test/p.jpg", title: "Checkout test" },
    });
    const { scene } = (await create.json()) as { scene: { id: string } };
    const co = await request.post("/api/stripe/checkout", { data: { sceneId: scene.id } });
    expect(co.status()).toBe(200);
    const j = (await co.json()) as { url?: string };
    expect(j.url).toContain("scene_id=");
  });
});
