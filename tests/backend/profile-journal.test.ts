import { convexTest } from "convex-test";
import { beforeEach, expect, test, vi } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { profileDefaults } from "../../convex/profileDefaults";
const modules = import.meta.glob("../../convex/**/*.{ts,js}");
const key = "test-only-admin-key";
beforeEach(() => vi.stubEnv("ATELIER_ADMIN_KEY", key));
const entry = {
  title: "Günlük sayfam",
  date: "2025-05-07",
  body: "Birinci paragraf.\n\nİkinci paragraf.",
  images: [
    { externalImage: "https://images.unsplash.com/test", caption: "Bir not" },
  ],
};
test("profile validates auth, contact URLs, theme and revisions", async () => {
  const t = convexTest(schema, modules);
  expect((await t.query(api.profile.get)).heroLine1).toBe(
    profileDefaults.heroLine1,
  );
  await expect(
    t.mutation(api.profile.save, {
      key: "wrong",
      expectedUpdatedAt: 0,
      profile: profileDefaults,
    }),
  ).rejects.toThrow("geçersiz");
  for (const invalid of [
    { email: "nope" },
    { phone: "abc" },
    { backgroundColor: "red" },
    { heroLine1: " " },
    { links: [{ label: "Site", url: "javascript:alert(1)" }] },
  ])
    await expect(
      t.mutation(api.profile.save, {
        key,
        expectedUpdatedAt: 0,
        profile: { ...profileDefaults, ...invalid },
      }),
    ).rejects.toThrow();
  await t.mutation(api.profile.save, {
    key,
    expectedUpdatedAt: 0,
    profile: {
      ...profileDefaults,
      name: "Ada",
      heroLine1: "Çizgilerim,",
      email: "ada@example.com",
      phone: "+90 555 123 45 67",
      links: [{ label: "ArtStation", url: "https://artstation.com/ada" }],
    },
  });
  const saved = await t.query(api.profile.get);
  expect(saved.name).toBe("Ada");
  expect(saved.heroLine1).toBe("Çizgilerim,");
  await expect(
    t.mutation(api.profile.save, {
      key,
      expectedUpdatedAt: 0,
      profile: profileDefaults,
    }),
  ).rejects.toThrow("başka bir oturumda");
});
test("journal sorts chronologically, validates limits and protects changes", async () => {
  const t = convexTest(schema, modules);
  await expect(
    t.mutation(api.journal.save, { key: "", entry }),
  ).rejects.toThrow("geçersiz");
  for (const invalid of [
    { images: [] },
    { images: Array(13).fill(entry.images[0]) },
    { date: "2025-02-31" },
    { images: [{ externalImage: "javascript:bad", caption: "" }] },
  ])
    await expect(
      t.mutation(api.journal.save, { key, entry: { ...entry, ...invalid } }),
    ).rejects.toThrow();
  const id = await t.mutation(api.journal.save, { key, entry });
  await t.mutation(api.journal.save, {
    key,
    entry: { ...entry, date: "2025-01-01" },
  });
  const rows = await t.query(api.journal.list);
  expect(rows[0].date).toBe("2025-01-01");
  const saved = rows.find((row) => row.id === id)!;
  await expect(
    t.mutation(api.journal.remove, { key, id, expectedUpdatedAt: 0 }),
  ).rejects.toThrow("başka bir oturumda");
  await t.mutation(api.journal.save, {
    key,
    id,
    expectedUpdatedAt: saved.updatedAt,
    entry: { ...entry, title: "Yeni başlık" },
  });
  const updated = (await t.query(api.journal.list)).find(
    (row) => row.id === id,
  )!;
  expect(updated.title).toBe("Yeni başlık");
  await t.mutation(api.journal.remove, {
    key,
    id,
    expectedUpdatedAt: updated.updatedAt,
  });
  expect(await t.query(api.journal.list)).toHaveLength(1);
});
test("avatar and journal files survive cleanup; replacing/removing cleans only unused files", async () => {
  const t = convexTest(schema, modules);
  const store = () =>
    t.run(async (ctx) => {
      const id = await ctx.storage.store(
        new Blob(["image"], { type: "image/webp" }),
      );
      await ctx.db.patch(id as any, { contentType: "image/webp" } as any);
      return id;
    });
  const avatarId = await store();
  await t.mutation(api.profile.save, {
    key,
    expectedUpdatedAt: 0,
    profile: { ...profileDefaults, avatarId },
  });
  const storageId = await store(),
    thumbnailId = await store();
  const id = await t.mutation(api.journal.save, {
    key,
    entry: {
      ...entry,
      images: [{ storageId, thumbnailId, caption: "Caption" }],
    },
  });
  await t.mutation(api.works.discardUploads, {
    key,
    ids: [avatarId, storageId, thumbnailId],
  });
  for (const file of [avatarId, storageId, thumbnailId])
    expect(await t.run((ctx) => ctx.db.system.get(file))).not.toBeNull();
  await expect(
    t.mutation(api.journal.save, {
      key,
      entry: {
        ...entry,
        images: [{ storageId: avatarId, thumbnailId: avatarId, caption: "" }],
      },
    }),
  ).rejects.toThrow("başka bir kayda");
  const [saved] = await t.query(api.journal.list);
  await t.mutation(api.journal.remove, {
    key,
    id,
    expectedUpdatedAt: saved.updatedAt,
  });
  expect(await t.run((ctx) => ctx.db.system.get(storageId))).toBeNull();
  expect(await t.run((ctx) => ctx.db.system.get(thumbnailId))).toBeNull();
  expect(await t.run((ctx) => ctx.db.system.get(avatarId))).not.toBeNull();
  const profile = await t.query(api.profile.get);
  await t.mutation(api.profile.save, {
    key,
    expectedUpdatedAt: profile.updatedAt,
    profile: profileDefaults,
  });
  expect(await t.run((ctx) => ctx.db.system.get(avatarId))).toBeNull();
});
