import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
const key = readFileSync(".env.admin.local", "utf8").trim().split("=")[1];
const url = readFileSync(".env.local", "utf8")
  .match(/^VITE_CONVEX_URL=(.+)$/m)[1]
  .trim();
if (!url.includes("marvelous-chickadee-389"))
  throw new Error("E2E only runs on the designated dev deployment");
const client = new ConvexHttpClient(url);
async function login(page) {
  await page.getByRole("button", { name: "Sanatçı stüdyosu" }).click();
  await page.getByLabel("Stüdyo anahtarı").fill(key);
  await page.getByRole("button", { name: "Stüdyoya gir", exact: true }).click();
}
test("profile, editable heading, contacts and theme are shared across sessions", async ({
  page,
  browser,
}) => {
  const original = await client.query(api.profile.get);
  const name = `E2E Artist ${Date.now()}`;
  const visitor = await browser.newContext();
  try {
    await page.goto("/");
    await login(page);
    await page
      .getByRole("button", { name: "Bilgi & görünüm", exact: true })
      .click();
    await page.getByLabel("İsim / sanatçı adı").fill(name);
    await page.getByLabel("Ana başlık · 1. satır").fill("Kendi çizgimde,");
    await page.getByLabel("Ana başlık · 2. satır").fill("kendi dünyamda.");
    await page
      .getByLabel("E-posta", { exact: true })
      .fill("artist@example.com");
    await page.getByLabel("Telefon", { exact: true }).fill("+90 555 123 45 67");
    await page.getByLabel("Konum", { exact: true }).fill("İstanbul");
    if (!original.avatarId) {
      const bytes = await page.screenshot();
      await page
        .getByLabel("Profil fotoğrafı", { exact: true })
        .setInputFiles({
          name: "avatar.png",
          mimeType: "image/png",
          buffer: bytes,
        });
    }
    await page
      .getByRole("button", { name: "Bağlantı ekle", exact: true })
      .click();
    const index = original.links.length + 1;
    await page
      .getByLabel(`Bağlantı ${index} adı`, { exact: true })
      .fill("ArtStation test");
    await page
      .getByLabel(`Bağlantı ${index} adresi`, { exact: true })
      .fill("https://www.artstation.com/");
    await page.getByRole("button", { name: "Gece", exact: true }).click();
    await page
      .getByRole("button", { name: "Bilgileri kaydet", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Bilgi ve görünüm" }),
    ).toHaveCount(0);
    const other = await visitor.newPage();
    await other.goto("http://localhost:5173");
    await expect(other.locator(".hero h1")).toContainText("Kendi çizgimde,");
    await expect(other.locator(".artist-identity h2")).toHaveText(name);
    await expect(
      other.getByRole("link", { name: "artist@example.com" }),
    ).toHaveAttribute("href", "mailto:artist@example.com");
    await expect(
      other.getByRole("link", { name: "ArtStation test" }),
    ).toHaveAttribute("href", "https://www.artstation.com/");
    await expect(other.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(other.locator(".profile-avatar").first()).toHaveJSProperty(
      "complete",
      true,
    );
    await other.setViewportSize({ width: 390, height: 844 });
    await expect(other.locator("body")).toHaveJSProperty("scrollWidth", 390);
  } finally {
    const current = await client.query(api.profile.get);
    if (current.name === name) {
      const { _id, _creationTime, singleton, updatedAt, avatar, ...profile } =
        original;
      await client.mutation(api.profile.save, {
        key,
        profile,
        expectedUpdatedAt: current.updatedAt,
      });
    }
    await visitor.close();
  }
});
test("journal multi-image upload, date timeline, detail links, lightbox and deletion", async ({
  page,
  browser,
}) => {
  const title = `E2E Journal ${Date.now()}`;
  let id;
  const visitor = await browser.newContext();
  try {
    await page.goto("/");
    await login(page);
    await page
      .getByRole("button", { name: "Art journal", exact: true })
      .click();
    await page.getByRole("button", { name: "Günlük kaydı ekle" }).click();
    await page.getByLabel("Kayıt başlığı").fill(title);
    await page.getByLabel("Kayıt tarihi").fill("2026-09-21");
    await page
      .getByLabel("Günlük metni")
      .fill("Bugün yeni çizgiler denedim.\n\nİki farklı kare.");
    const bytes = await page.screenshot();
    await page.getByLabel("Günlük görselleri").setInputFiles([
      { name: "first.png", mimeType: "image/png", buffer: bytes },
      { name: "second.png", mimeType: "image/png", buffer: bytes },
    ]);
    await expect(page.locator(".journal-upload-row")).toHaveCount(2);
    await page.getByLabel("Görsel 1 açıklaması").fill("İlk kare");
    await page.getByLabel("Görsel 2 açıklaması").fill("İkinci kare");
    await page
      .getByRole("button", { name: "2. görseli öne al", exact: true })
      .click();
    await expect(page.getByLabel("Görsel 1 açıklaması")).toHaveValue(
      "İkinci kare",
    );
    await page
      .getByRole("button", { name: "Kaydı yayımla", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Günlük kaydı düzenleyici" }),
    ).toHaveCount(0);
    id = (await client.query(api.journal.list)).find(
      (e) => e.title === title,
    ).id;
    const other = await visitor.newPage();
    await other.goto(`http://localhost:5173/#journal/${id}`);
    await expect(
      other.getByRole("dialog", { name: title, exact: true }),
    ).toBeVisible();
    await expect(other.locator(".journal-detail-header")).toContainText(
      "21 Eylül 2026",
    );
    await other
      .getByRole("button", { name: "1. görseli büyüt", exact: true })
      .click();
    await expect(
      other.getByRole("dialog", { name: "Günlük görseli" }),
    ).toBeVisible();
    await expect(other.locator(".lightbox-caption")).toContainText(
      "İkinci kare",
    );
    await other.keyboard.press("ArrowRight");
    await expect(other.locator(".lightbox-caption")).toContainText("İlk kare");
    await other.keyboard.press("Escape");
    await expect(
      other.getByRole("dialog", { name: title, exact: true }),
    ).toBeVisible();
    await other.getByRole("button", { name: "Günlük detayını kapat" }).click();
    await other.setViewportSize({ width: 390, height: 844 });
    await expect(other.locator("body")).toHaveJSProperty("scrollWidth", 390);
    const rail = other.locator(".journal-rail");
    await expect(rail).toBeVisible();
    expect(await rail.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await page.getByLabel("Kayıt başlığı").fill(`${title} edited`);
    await page.getByRole("button", { name: "Kaydı yayımla" }).click();
    await expect(
      other.locator(".journal-title").filter({ hasText: `${title} edited` }),
    ).toHaveCount(1);
    await page
      .getByRole("button", { name: new RegExp(`${title} edited`) })
      .click();
    await page.getByRole("button", { name: "Kaydı sil", exact: true }).click();
    await page.getByRole("button", { name: "Kaydı silmeyi onayla" }).click();
    await expect(
      other.locator(".journal-title").filter({ hasText: title }),
    ).toHaveCount(0);
  } finally {
    const entries = await client.query(api.journal.list);
    for (const entry of entries.filter((e) => e.title.startsWith(title)))
      await client.mutation(api.journal.remove, {
        key,
        id: entry.id,
        expectedUpdatedAt: entry.updatedAt,
      });
    await visitor.close();
  }
});
