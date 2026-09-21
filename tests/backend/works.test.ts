import { convexTest } from "convex-test";
import { beforeEach, expect, test, vi } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
const modules = import.meta.glob("../../convex/**/*.{ts,js}");
const key = "test-only-admin-key";
const work = {
  title: "Test",
  category: "Dijital sanat" as const,
  date: "2025-01-01",
  medium: "Watercolor",
  description: "Story",
  tags: [" Nature ", "Nature"],
  ratio: "tall" as const,
  externalImage: "https://images.unsplash.com/test",
};
beforeEach(() => vi.stubEnv("ATELIER_ADMIN_KEY", key));
test("public can read, writes require server authorization", async () => {
  const t = convexTest(schema, modules);
  expect(await t.query(api.works.list)).toEqual([]);
  await expect(
    t.mutation(api.works.save, { key: "wrong", work }),
  ).rejects.toThrow("geçersiz");
  await expect(
    t.mutation(api.works.generateUploadUrl, { key: "" }),
  ).rejects.toThrow("geçersiz");
  vi.stubEnv("ATELIER_ADMIN_KEY", "");
  await expect(t.mutation(api.works.verifyAdmin, { key })).rejects.toThrow(
    "yapılandırılmadı",
  );
});
test("CRUD checks revisions, validation and tag normalization", async () => {
  const t = convexTest(schema, modules);
  const id = await t.mutation(api.works.save, { key, work });
  let [saved] = await t.query(api.works.list);
  expect(saved.tags).toEqual(["Nature"]);
  await expect(
    t.mutation(api.works.save, { key, id, work, expectedUpdatedAt: 0 }),
  ).rejects.toThrow("başka bir oturumda");
  await t.mutation(api.works.save, {
    key,
    id,
    work: { ...work, title: "Updated" },
    expectedUpdatedAt: saved.updatedAt,
  });
  await expect(
    t.mutation(api.works.remove, {
      key,
      id,
      expectedUpdatedAt: saved.updatedAt,
    }),
  ).rejects.toThrow("başka bir oturumda");
  [saved] = await t.query(api.works.list);
  expect(saved.title).toBe("Updated");
  await t.mutation(api.works.remove, {
    key,
    id,
    expectedUpdatedAt: saved.updatedAt,
  });
  expect(await t.query(api.works.list)).toHaveLength(0);
  for (const invalid of [
    { title: " " },
    { date: "2025-02-31" },
    { externalImage: "javascript:alert(1)" },
  ])
    await expect(
      t.mutation(api.works.save, { key, work: { ...work, ...invalid } } as any),
    ).rejects.toThrow();
});
test("storage validates MIME and cleans replacements/deletes, protects attached files", async () => {
  const t = convexTest(schema, modules);
  // convex-test's storeBlob omits contentType; emulate HTTP upload metadata.
  const store = (type: string) =>
    t.run(async (ctx) => {
      const id = await ctx.storage.store(new Blob(["bytes"], { type }));
      await ctx.db.patch(id as any, { contentType: type } as any);
      return id;
    });
  const storageId = await store("image/png"),
    thumbnailId = await store("image/webp");
  const id = await t.mutation(api.works.save, {
    key,
    work: { ...work, storageId, thumbnailId },
  });
  await t.mutation(api.works.discardUploads, {
    key,
    ids: [storageId, thumbnailId],
  });
  expect(await t.run((ctx) => ctx.db.system.get(storageId))).not.toBeNull();
  await expect(
    t.mutation(api.works.save, {
      key,
      work: { ...work, storageId, thumbnailId },
    }),
  ).rejects.toThrow("başka bir esere");
  const bad = await store("text/html");
  await expect(
    t.mutation(api.works.save, {
      key,
      work: { ...work, storageId: bad, thumbnailId: bad },
    }),
  ).rejects.toThrow("geçersiz");
  const [saved] = await t.query(api.works.list);
  const replacement = await store("image/jpeg");
  await t.mutation(api.works.save, {
    key,
    id,
    expectedUpdatedAt: saved.updatedAt,
    work: { ...work, storageId: replacement, thumbnailId: replacement },
  });
  expect(await t.run((ctx) => ctx.db.system.get(storageId))).toBeNull();
  expect(await t.run((ctx) => ctx.db.system.get(thumbnailId))).toBeNull();
  const [updated] = await t.query(api.works.list);
  await t.mutation(api.works.remove, {
    key,
    id,
    expectedUpdatedAt: updated.updatedAt,
  });
  expect(await t.run((ctx) => ctx.db.system.get(replacement))).toBeNull();
});
test("migration is idempotent and preserves edits to sample works", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.samples, {});
  expect(await t.query(api.works.list)).toHaveLength(8);
  const id = await t.mutation(api.works.save, {
    key,
    migrationKey: "legacy:1",
    work: { ...work, title: "My local edit" },
  });
  const again = await t.mutation(api.works.save, {
    key,
    migrationKey: "legacy:1",
    work,
  });
  expect(again).toBe(id);
  const rows = await t.query(api.works.list);
  expect(rows).toHaveLength(8);
  expect(rows.find((w) => w.id === id)?.title).toBe("My local edit");
});
