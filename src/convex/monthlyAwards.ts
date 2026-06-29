import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { period: v.string(), hubId: v.string() },
  handler: async (ctx, args) => {
    const awards = await ctx.db
      .query("monthlyAwards")
      .withIndex("by_period", (q) => q.eq("period", args.period))
      .collect();
    return awards.find((a) => a.hubId === args.hubId) ?? null;
  },
});

export const save = mutation({
  args: {
    period: v.string(),
    hubId: v.string(),
    hubName: v.string(),
    winners: v.array(v.object({
      rank: v.number(),
      studentId: v.string(),
      studentName: v.string(),
      attendanceRate: v.number(),
      present: v.number(),
      late: v.number(),
      streak: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("monthlyAwards")
      .withIndex("by_period", (q) => q.eq("period", args.period))
      .collect();
    const match = existing.find((a) => a.hubId === args.hubId);
    if (match) {
      await ctx.db.patch(match._id, {
        winners: args.winners,
        hubName: args.hubName,
        computedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("monthlyAwards", {
        period: args.period,
        hubId: args.hubId,
        hubName: args.hubName,
        winners: args.winners,
        computedAt: Date.now(),
      });
    }
  },
});
