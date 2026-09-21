import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { profileFields } from "./schema";
import { profileDefaults } from "./profileDefaults";
import { requireAdmin } from "./lib/auth";
import { referenced, discard } from "./lib/storage";
export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("profile")
      .withIndex("by_singleton", (q) => q.eq("singleton", "artist"))
      .unique();
    if (!row)
      return {
        ...profileDefaults,
        updatedAt: 0,
        avatar: null,
        avatarId: undefined,
      };
    return {
      ...profileDefaults,
      ...row,
      avatar: row.avatarId ? await ctx.storage.getUrl(row.avatarId) : null,
    };
  },
});
export const save = mutation({
  args: {
    key: v.string(),
    expectedUpdatedAt: v.number(),
    profile: v.object(profileFields),
  },
  handler: async (ctx, { key, expectedUpdatedAt, profile }) => {
    requireAdmin(key);
    profile = { ...profileDefaults, ...profile };
    if (
      !profile.heroLine1?.trim() ||
      !profile.heroLine2?.trim() ||
      profile.heroLine1.length > 70 ||
      profile.heroLine2.length > 70 ||
      (profile.heroIntro?.length || 0) > 600 ||
      (profile.heroEyebrow?.length || 0) > 100
    )
      throw new ConvexError("Başlık ve giriş yazısının uzunluğunu kontrol et.");
    const previous = await ctx.db
      .query("profile")
      .withIndex("by_singleton", (q) => q.eq("singleton", "artist"))
      .unique();
    if ((previous?.updatedAt || 0) !== expectedUpdatedAt)
      throw new ConvexError(
        "Profil başka bir oturumda değişti. Kapatıp tekrar aç.",
      );
    const name = profile.name.trim();
    if (!name || name.length > 100)
      throw new ConvexError("İsim 1–100 karakter olmalı.");
    if (
      profile.headline.length > 160 ||
      profile.bio.length > 5000 ||
      profile.location.length > 120
    )
      throw new ConvexError("Profil metni çok uzun.");
    const email = profile.email.trim(),
      phone = profile.phone.trim();
    if (
      email &&
      (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    )
      throw new ConvexError("Geçerli bir e-posta adresi gir.");
    if (phone && (!/^[+\d\s().-]{3,40}$/.test(phone) || !/[0-9]/.test(phone)))
      throw new ConvexError("Geçerli bir telefon numarası gir.");
    for (const color of [profile.backgroundColor, profile.accentColor])
      if (!/^#[0-9a-fA-F]{6}$/.test(color))
        throw new ConvexError("Geçerli bir renk seç.");
    if (profile.links.length > 12)
      throw new ConvexError("En fazla 12 bağlantı ekleyebilirsin.");
    const links = profile.links.map((link) => {
      const label = link.label.trim(),
        url = link.url.trim();
      if (!label || label.length > 60 || url.length > 2048)
        throw new ConvexError("Bağlantı adı ve adresini kontrol et.");
      try {
        const parsed = new URL(url);
        if (
          !["https:", "http:"].includes(parsed.protocol) ||
          !parsed.hostname ||
          parsed.username ||
          parsed.password
        )
          throw new Error();
      } catch {
        throw new ConvexError(
          "Bağlantılar http:// veya https:// ile başlamalı.",
        );
      }
      return { label, url };
    });
    if (profile.avatarId) {
      const file = await ctx.db.system.get(profile.avatarId);
      if (
        !file ||
        file.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(
          file.contentType || "",
        )
      )
        throw new ConvexError(
          "Profil fotoğrafı JPG, PNG veya WebP ve en fazla 5 MB olmalı.",
        );
      const owner = await referenced(ctx, profile.avatarId);
      if (owner && owner._id !== previous?._id)
        throw new ConvexError("Bu dosya başka bir kayda ait.");
    }
    const value = {
      ...profile,
      name,
      email,
      phone,
      links,
      singleton: "artist" as const,
      updatedAt: Math.max(Date.now(), (previous?.updatedAt || 0) + 1),
    };
    if (previous) await ctx.db.replace(previous._id, value);
    else await ctx.db.insert("profile", value);
    if (previous?.avatarId) await discard(ctx, [previous.avatarId]);
  },
});
