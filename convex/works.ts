import { mutation, query, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { workFields } from "./schema";
import { requireAdmin } from "./lib/auth";
import { referenced, discard } from "./lib/storage";
import type { Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("works").order("desc").collect();
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        id: row._id,
        image: row.storageId
          ? await ctx.storage.getUrl(row.storageId)
          : row.externalImage,
        thumb: row.thumbnailId
          ? await ctx.storage.getUrl(row.thumbnailId)
          : row.externalThumbnail || row.externalImage,
      })),
    );
  },
});
export const verifyAdmin = mutation({
  args: { key: v.string() },
  handler: async (_, { key }) => {
    requireAdmin(key);
    return true;
  },
});
export const generateUploadUrl = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    requireAdmin(key);
    return ctx.storage.generateUploadUrl();
  },
});
export const discardUploads = mutation({
  args: { key: v.string(), ids: v.array(v.id("_storage")) },
  handler: async (ctx, { key, ids }) => {
    requireAdmin(key);
    await discard(ctx, ids);
  },
});
export const save = mutation({
  args: {
    key: v.string(),
    id: v.optional(v.id("works")),
    expectedUpdatedAt: v.optional(v.number()),
    migrationKey: v.optional(v.string()),
    work: v.object(workFields),
  },
  handler: async (ctx, { key, id, expectedUpdatedAt, migrationKey, work }) => {
    requireAdmin(key);
    const title = work.title.trim();
    if (!title || title.length > 100)
      throw new ConvexError("Eser adı 1–100 karakter olmalı.");
    if (
      work.description.length > 10000 ||
      work.medium.length > 300 ||
      work.tags.length > 30 ||
      work.tags.some((t) => t.length > 60)
    )
      throw new ConvexError("Metin veya etiket sınırı aşıldı.");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(work.date) ||
      !Number.isFinite(Date.parse(work.date)) ||
      new Date(work.date).toISOString().slice(0, 10) !== work.date
    )
      throw new ConvexError("Geçerli bir tarih gir.");
    if (!work.storageId && !work.externalImage)
      throw new ConvexError("Bir eser görseli gerekli.");
    if (!!work.storageId !== !!work.thumbnailId)
      throw new ConvexError("Orijinal ve önizleme birlikte yüklenmeli.");
    for (const url of [work.externalImage, work.externalThumbnail])
      if (url && !url.startsWith("https://images.unsplash.com/"))
        throw new ConvexError(
          "Harici görseller yalnızca örnek Unsplash eserleri için kullanılabilir.",
        );
    if (migrationKey) {
      if (migrationKey.length > 200)
        throw new ConvexError("Aktarım kimliği çok uzun.");
      const existing = await ctx.db
        .query("works")
        .withIndex("by_migration", (q) => q.eq("migrationKey", migrationKey))
        .unique();
      if (existing) {
        await discard(
          ctx,
          [work.storageId, work.thumbnailId].filter(
            (x): x is Id<"_storage"> => !!x,
          ),
        );
        return existing._id;
      }
      const sample = await ctx.db
        .query("works")
        .withIndex("by_migration", (q) =>
          q.eq("migrationKey", migrationKey.replace(/^legacy:/, "sample:")),
        )
        .unique();
      if (sample) {
        id = sample._id;
        expectedUpdatedAt = sample.updatedAt;
      }
    }
    const previous = id ? await ctx.db.get(id) : null;
    if (id && !previous) throw new ConvexError("Eser artık mevcut değil.");
    if (previous && previous.updatedAt !== expectedUpdatedAt)
      throw new ConvexError(
        "Eser başka bir oturumda değişti. Kapatıp tekrar aç.",
      );
    for (const storageId of [work.storageId, work.thumbnailId]) {
      if (!storageId) continue;
      const file = await ctx.db.system.get(storageId);
      if (
        !file ||
        file.size > 30 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          file.contentType || "",
        )
      )
        throw new ConvexError("Görsel geçersiz veya 30 MB sınırını aşıyor.");
      const owner = await referenced(ctx, storageId);
      if (owner && owner._id !== id)
        throw new ConvexError("Bu dosya başka bir esere ait.");
    }
    const value = {
      ...work,
      title,
      tags: [...new Set(work.tags.map((t) => t.trim()).filter(Boolean))],
      updatedAt: Math.max(Date.now(), (previous?.updatedAt || 0) + 1),
    };
    const result =
      id ||
      (await ctx.db.insert("works", {
        ...value,
        ...(migrationKey ? { migrationKey } : {}),
      }));
    if (id)
      await ctx.db.replace(id, {
        ...value,
        ...(migrationKey || previous?.migrationKey
          ? { migrationKey: migrationKey || previous?.migrationKey }
          : {}),
      });
    if (previous)
      await discard(
        ctx,
        [previous.storageId, previous.thumbnailId].filter(
          (x): x is Id<"_storage"> => !!x,
        ),
      );
    return result;
  },
});
export const remove = mutation({
  args: { key: v.string(), id: v.id("works"), expectedUpdatedAt: v.number() },
  handler: async (ctx, { key, id, expectedUpdatedAt }) => {
    requireAdmin(key);
    const row = await ctx.db.get(id);
    if (!row) return;
    if (row.updatedAt !== expectedUpdatedAt)
      throw new ConvexError(
        "Eser başka bir oturumda değişti. Kapatıp tekrar aç.",
      );
    await ctx.db.delete(id);
    await discard(
      ctx,
      [row.storageId, row.thumbnailId].filter((x): x is Id<"_storage"> => !!x),
    );
  },
});
// Collect abandoned uploads (closed tabs/network failures), never attached files.
export const cleanup = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.system
      .query("_storage")
      .paginate({ cursor, numItems: 100 });
    for (const file of page.page)
      if (file._creationTime < Date.now() - 86400000)
        await discard(ctx, [file._id]);
    return { cursor: page.continueCursor, done: page.isDone };
  },
});
