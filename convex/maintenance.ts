import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
export const cleanup = internalAction({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null;
    for (;;) {
      const page: { cursor: string; done: boolean } = await ctx.runMutation(
        internal.works.cleanup,
        { cursor },
      );
      if (page.done) break;
      cursor = page.cursor;
    }
  },
});
