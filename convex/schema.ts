import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export const workFields = {
  title: v.string(),
  category: v.union(
    v.literal("Dijital sanat"),
    v.literal("İllüstrasyon"),
    v.literal("Fotoğraf"),
  ),
  date: v.string(),
  medium: v.string(),
  description: v.string(),
  tags: v.array(v.string()),
  ratio: v.union(v.literal("tall"), v.literal("short"), v.literal("medium")),
  storageId: v.optional(v.id("_storage")),
  thumbnailId: v.optional(v.id("_storage")),
  externalImage: v.optional(v.string()),
  externalThumbnail: v.optional(v.string()),
};
export const profileFields = {
  heroLine1: v.optional(v.string()),
  heroLine2: v.optional(v.string()),
  heroIntro: v.optional(v.string()),
  heroEyebrow: v.optional(v.string()),
  name: v.string(),
  headline: v.string(),
  bio: v.string(),
  location: v.string(),
  email: v.string(),
  phone: v.string(),
  links: v.array(v.object({ label: v.string(), url: v.string() })),
  backgroundColor: v.string(),
  accentColor: v.string(),
  textColor: v.optional(v.string()),
  avatarId: v.optional(v.id("_storage")),
  logoId: v.optional(v.id("_storage")),
};
export const journalImage = v.object({
  storageId: v.optional(v.id("_storage")),
  thumbnailId: v.optional(v.id("_storage")),
  externalImage: v.optional(v.string()),
  externalThumbnail: v.optional(v.string()),
  caption: v.string(),
});
export const journalFields = {
  title: v.string(),
  date: v.string(),
  body: v.string(),
  images: v.array(journalImage),
};
export default defineSchema({
  journal: defineTable({ ...journalFields, updatedAt: v.number() }).index(
    "by_date",
    ["date"],
  ),
  journalFiles: defineTable({
    journalId: v.id("journal"),
    storageId: v.id("_storage"),
  })
    .index("by_storage", ["storageId"])
    .index("by_journal", ["journalId"]),
  profile: defineTable({
    ...profileFields,
    singleton: v.literal("artist"),
    updatedAt: v.number(),
  })
    .index("by_singleton", ["singleton"])
    .index("by_avatar", ["avatarId"])
    .index("by_logo", ["logoId"]),
  works: defineTable({
    ...workFields,
    updatedAt: v.number(),
    migrationKey: v.optional(v.string()),
  })
    .index("by_migration", ["migrationKey"])
    .index("by_original", ["storageId"])
    .index("by_thumbnail", ["thumbnailId"]),
});
