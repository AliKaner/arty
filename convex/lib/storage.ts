import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
export async function referenced(ctx: MutationCtx, id: Id<"_storage">) {
  const journal = await ctx.db
    .query("journalFiles")
    .withIndex("by_storage", (q) => q.eq("storageId", id))
    .first();
  if (journal) return { _id: journal.journalId };
  return (
    (await ctx.db
      .query("works")
      .withIndex("by_original", (q) => q.eq("storageId", id))
      .first()) ||
    (await ctx.db
      .query("works")
      .withIndex("by_thumbnail", (q) => q.eq("thumbnailId", id))
      .first()) ||
    (await ctx.db
      .query("profile")
      .withIndex("by_avatar", (q) => q.eq("avatarId", id))
      .first()) ||
    (await ctx.db
      .query("profile")
      .withIndex("by_logo", (q) => q.eq("logoId", id))
      .first())
  );
}
export async function discard(ctx: MutationCtx, ids: Id<"_storage">[]) {
  for (const id of new Set(ids))
    if (!(await referenced(ctx, id)) && (await ctx.db.system.get(id)))
      await ctx.storage.delete(id);
}
