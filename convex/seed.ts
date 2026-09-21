import { internalMutation } from "./_generated/server";
import { initial } from "./sampleWorks";
export const samples = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query("works").first()) return { inserted: 0 };
    for (const sample of [...initial].reverse()) {
      const { id, year, image, ...work } = sample;
      await ctx.db.insert("works", {
        ...work,
        category: work.category as
          "Dijital sanat" | "İllüstrasyon" | "Fotoğraf",
        ratio: work.ratio as "tall" | "short" | "medium",
        externalImage: image,
        externalThumbnail: image,
        migrationKey: `sample:${id}`,
        updatedAt: Date.now(),
      });
    }
    return { inserted: initial.length };
  },
});
