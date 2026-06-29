import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const publish = mutation({
  args: {
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const seq = Date.now();
    await ctx.db.insert("appUpdates", {
      seq,
      title: args.title.trim(),
      message: args.message.trim(),
      createdAt: Date.now(),
    });
    return seq;
  },
});

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    const updates = await ctx.db
      .query("appUpdates")
      .withIndex("by_seq")
      .order("desc")
      .take(1);
    return updates[0] ?? null;
  },
});
