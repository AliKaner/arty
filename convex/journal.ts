import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { journalFields } from "./schema";
import { requireAdmin } from "./lib/auth";
import { referenced, discard } from "./lib/storage";
import type { Id } from "./_generated/dataModel";
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("journal")
      .withIndex("by_date")
      .order("asc")
      .collect();
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        id: row._id,
        images: await Promise.all(
          row.images.map(async (image) => ({
            ...image,
            image: image.storageId
              ? await ctx.storage.getUrl(image.storageId)
              : image.externalImage,
            thumb: image.thumbnailId
              ? await ctx.storage.getUrl(image.thumbnailId)
              : image.externalThumbnail || image.externalImage,
          })),
        ),
      })),
    );
  },
});
export const save = mutation({
  args: {
    key: v.string(),
    id: v.optional(v.id("journal")),
    expectedUpdatedAt: v.optional(v.number()),
    entry: v.object(journalFields),
  },
  handler: async (ctx, { key, id, expectedUpdatedAt, entry }) => {
    requireAdmin(key);
    if (
      !entry.title.trim() ||
      entry.title.length > 120 ||
      entry.body.length > 20000
    )
      throw new ConvexError(
        "Başlık 1–120, metin en fazla 20.000 karakter olmalı.",
      );
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
      !Number.isFinite(Date.parse(entry.date)) ||
      new Date(entry.date).toISOString().slice(0, 10) !== entry.date
    )
      throw new ConvexError("Geçerli bir tarih gir.");
    if (entry.images.length < 1 || entry.images.length > 12)
      throw new ConvexError("Her günlük kaydına 1–12 görsel ekle.");
    const previous = id ? await ctx.db.get(id) : null;
    if (id && !previous)
      throw new ConvexError("Günlük kaydı artık mevcut değil.");
    if (previous && previous.updatedAt !== expectedUpdatedAt)
      throw new ConvexError(
        "Kayıt başka bir oturumda değişti. Kapatıp tekrar aç.",
      );
    const ids = new Set<Id<"_storage">>();
    for (const image of entry.images) {
      if (image.caption.length > 1000)
        throw new ConvexError(
          "Görsel açıklaması en fazla 1000 karakter olmalı.",
        );
      if (!image.storageId && !image.externalImage)
        throw new ConvexError("Bir görsel yükle.");
      if (!!image.storageId !== !!image.thumbnailId)
        throw new ConvexError("Orijinal ve önizleme birlikte yüklenmeli.");
      for (const url of [image.externalImage, image.externalThumbnail])
        if (url && !url.startsWith("https://images.unsplash.com/"))
          throw new ConvexError("Geçersiz görsel kaynağı.");
      for (const storageId of [image.storageId, image.thumbnailId]) {
        if (!storageId) continue;
        ids.add(storageId);
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
          throw new ConvexError("Bu görsel başka bir kayda ait.");
      }
    }
    const value = {
      ...entry,
      title: entry.title.trim(),
      updatedAt: Math.max(Date.now(), (previous?.updatedAt || 0) + 1),
    };
    const result = id || (await ctx.db.insert("journal", value));
    const oldFiles = id
      ? await ctx.db
          .query("journalFiles")
          .withIndex("by_journal", (q) => q.eq("journalId", id))
          .collect()
      : [];
    if (id) await ctx.db.replace(id, value);
    for (const file of oldFiles) await ctx.db.delete(file._id);
    for (const storageId of ids)
      await ctx.db.insert("journalFiles", { journalId: result, storageId });
    await discard(
      ctx,
      oldFiles.map((file) => file.storageId),
    );
    return result;
  },
});
export const remove = mutation({
  args: { key: v.string(), id: v.id("journal"), expectedUpdatedAt: v.number() },
  handler: async (ctx, { key, id, expectedUpdatedAt }) => {
    requireAdmin(key);
    const previous = await ctx.db.get(id);
    if (!previous) return;
    if (previous.updatedAt !== expectedUpdatedAt)
      throw new ConvexError(
        "Kayıt başka bir oturumda değişti. Kapatıp tekrar aç.",
      );
    const files = await ctx.db
      .query("journalFiles")
      .withIndex("by_journal", (q) => q.eq("journalId", id))
      .collect();
    await ctx.db.delete(id);
    for (const file of files) await ctx.db.delete(file._id);
    await discard(
      ctx,
      files.map((f) => f.storageId),
    );
  },
});
// Development-only fixtures. Never called automatically or from the browser.
export const samples = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query("journal").first()) return;
    const photo = (id: string) =>
      `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;
    const samples = [
      {
        title: "Yavaşlamayı öğrenirken",
        date: "2025-02-18",
        body: "Bugün hiçbir şeyi tamamlamaya çalışmadım. Sadece yürüdüm, baktım ve birkaç renk notu aldım.\n\nBazen üretmek, bir şey yapmamakla başlıyor. Yanıma aldığım defterin boş sayfaları bile iyi geldi.",
        images: [
          {
            externalImage: photo("photo-1441974231531-c6227db76b6e"),
            caption: "Işığın yaprakların arasından geçtiği o kısa an.",
          },
          {
            externalImage: photo("photo-1470770841072-f978cf4d019e"),
            caption: "Defterime taşıdığım renkler.",
          },
        ],
      },
      {
        title: "Bir rengin peşinde",
        date: "2025-03-07",
        body: "Bir süredir aklımda kalan o pembeyi arıyorum. Fotoğrafta başka, kâğıtta başka, hafızamda bambaşka.\n\nBu küçük arayışları seviyorum. Sonucun nereye varacağını bilmeden, sadece merak ederek çalışmayı.",
        images: [
          {
            externalImage: photo("photo-1493976040374-85c8e12f0c0e"),
            caption: "Bugünün ilhamı.",
          },
          {
            externalImage: photo("photo-1470252649378-9c29740c9fa8"),
            caption: "Sabahın ilk renkleri.",
          },
        ],
      },
      {
        title: "Henüz bitirmediklerim",
        date: "2025-04-12",
        body: "Her çalışmamın hemen bir yere varması gerekmiyor. Bazılarını bir kenara bırakıp, haftalar sonra başka bir gözle bakıyorum.\n\nBugün o yarım kalanların arasından birkaç parçayı yeniden buldum. Burada onları da biriktirmek istiyorum.",
        images: [
          {
            externalImage: photo("photo-1500534623283-312aade485b7"),
            caption: "Bir sonraki çalışmam için ışık notları.",
          },
        ],
      },
    ];
    for (const entry of samples)
      await ctx.db.insert("journal", { ...entry, updatedAt: Date.now() });
  },
});
