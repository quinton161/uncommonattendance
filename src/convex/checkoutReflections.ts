import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const save = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    dailyAchieved: v.string(),
    dailyNote: v.string(),
    isFriday: v.boolean(),
    weeklyAchieved: v.optional(v.string()),
    weeklyReflection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("checkoutGoalLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        dailyAchieved: args.dailyAchieved,
        dailyNote: args.dailyNote.trim(),
        isFriday: args.isFriday,
        weeklyAchieved: args.isFriday ? args.weeklyAchieved : undefined,
        weeklyReflection: args.isFriday ? args.weeklyReflection?.trim() : undefined,
      });
    } else {
      await ctx.db.insert("checkoutGoalLogs", {
        userId: args.userId,
        date: args.date,
        dailyAchieved: args.dailyAchieved,
        dailyNote: args.dailyNote.trim(),
        isFriday: args.isFriday,
        weeklyAchieved: args.isFriday ? args.weeklyAchieved : undefined,
        weeklyReflection: args.isFriday ? args.weeklyReflection?.trim() : undefined,
        createdAt: Date.now(),
      });
    }
  },
});
