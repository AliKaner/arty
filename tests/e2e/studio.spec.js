import { readFileSync } from "node:fs";
const adminKey = readFileSync(".env.admin.local", "utf8").trim().split("=")[1];
import { test, expect } from "@playwright/test";
test("gallery, upload, persist, edit and delete", async ({ page, browser }) => {
  await page.goto("http://localhost:5173");
  await expect(page.locator(".art-card")).toHaveCount(8);
  await page
    .getByRole("button", { name: "İlkbaharın fısıltısı eserini aç" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".viewer-image > img")).toHaveAttribute(
    "src",
    /w=2400/,
  );
  await page.keyboard.press("Escape");
  await page.getByPlaceholder("Bir şeyler ara…").fill("Sessizliğin");
  await expect(page.locator(".art-card")).toHaveCount(1);
  await page.getByPlaceholder("Bir şeyler ara…").fill("");
  await page.getByRole("button", { name: "Sanatçı stüdyosu" }).click();
  if (await page.getByRole("dialog", { name: "Stüdyo girişi" }).count()) {
    await page.getByLabel("Stüdyo anahtarı").fill(adminKey);
    await page
      .getByRole("button", { name: "Stüdyoya gir", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Yeni eser ekle" }).click();
  const image = await page.screenshot();
  await page
    .locator("input[type=file]")
    .setInputFiles({ name: "test.png", mimeType: "image/png", buffer: image });
  await page.getByLabel("Eser adı", { exact: true }).fill("Test eseri");
  await page.getByLabel("Teknik & malzeme").fill("Suluboya");
  await page.getByLabel("Etiketler").fill("Test, Doğa");
  await page.getByRole("button", { name: "Eseri kaydet" }).click();
  await expect(page.locator(".art-card")).toHaveCount(9);
  const visitor = await browser.newContext();
  const other = await visitor.newPage();
  await other.goto("http://localhost:5173");
  await expect(other.locator(".art-card")).toHaveCount(9);
  await page.reload();
  await expect(page.locator(".art-card")).toHaveCount(9);
  await page.getByRole("button", { name: "Test eseri eserini aç" }).click();
  await expect(page.locator(".tag-list")).toContainText("Doğa");
  await expect(page.locator(".particles")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Sanatçı stüdyosu" }).click();
  if (await page.getByRole("dialog", { name: "Stüdyo girişi" }).count()) {
    await page.getByLabel("Stüdyo anahtarı").fill(adminKey);
    await page
      .getByRole("button", { name: "Stüdyoya gir", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Test eseri düzenle" }).click();
  await page.getByLabel("Eser adı", { exact: true }).fill("Düzenlenen eser");
  await page.getByRole("button", { name: "Eseri kaydet" }).click();
  await page.getByRole("button", { name: "Düzenlenen eser düzenle" }).click();
  await page.getByRole("button", { name: "Eseri sil", exact: true }).click();
  await page.getByRole("button", { name: "Silmeyi onayla" }).click();
  await expect(page.locator(".art-card")).toHaveCount(8);
  await expect(other.locator(".art-card")).toHaveCount(8);
  await visitor.close();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
});
