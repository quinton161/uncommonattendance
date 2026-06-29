import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    weekStart: v.string(),
    weekEnd: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("weeklyGoals", {
      userId: args.userId,
      title: args.title.trim(),
      description: args.description.trim(),
      weekStart: args.weekStart,
      weekEnd: args.weekEnd,
      status: args.status,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    goalId: v.id("weeklyGoals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    weekStart: v.optional(v.string()),
    weekEnd: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { goalId, ...updates } = args;
    const patch: Record<string, any> = {};
    if (updates.title !== undefined) patch.title = updates.title.trim();
    if (updates.description !== undefined) patch.description = updates.description.trim();
    if (updates.weekStart !== undefined) patch.weekStart = updates.weekStart;
    if (updates.weekEnd !== undefined) patch.weekEnd = updates.weekEnd;
    if (updates.status !== undefined) patch.status = updates.status;
    await ctx.db.patch(goalId, patch);
  },
});

export const remove = mutation({
  args: { goalId: v.id("weeklyGoals") },
  handler: async (ctx, args) => {
    const dailies = await ctx.db
      .query("dailyGoals")
      .withIndex("by_weeklyGoalId", (q) => q.eq("weeklyGoalId", args.goalId))
      .collect();
    for (const d of dailies) {
      await ctx.db.delete(d._id);
    }
    await ctx.db.delete(args.goalId);
  },
});

export const hasAny = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(1);
    return goals.length > 0;
  },
});

export const getWeekContainingDate = query({
  args: { userId: v.id("users"), dateStr: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return goals.find((g) => args.dateStr >= g.weekStart && args.dateStr <= g.weekEnd) || null;
  },
});
