import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { weeklyGoalId: v.id("weeklyGoals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyGoals")
      .withIndex("by_weeklyGoalId", (q) => q.eq("weeklyGoalId", args.weeklyGoalId))
      .order("asc")
      .collect();
  },
});

export const add = mutation({
  args: {
    weeklyGoalId: v.id("weeklyGoals"),
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dailyGoals", {
      weeklyGoalId: args.weeklyGoalId,
      userId: args.userId,
      title: args.title.trim(),
      description: args.description.trim(),
      date: args.date,
      status: args.status,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    goalId: v.id("dailyGoals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { goalId, ...updates } = args;
    const patch: Record<string, any> = {};
    if (updates.title !== undefined) patch.title = updates.title.trim();
    if (updates.description !== undefined) patch.description = updates.description.trim();
    if (updates.date !== undefined) patch.date = updates.date;
    if (updates.status !== undefined) patch.status = updates.status;
    await ctx.db.patch(goalId, patch);
  },
});

export const remove = mutation({
  args: { goalId: v.id("dailyGoals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.goalId);
  },
});

export const getByDate = query({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, args) => {
    const dailies = await ctx.db
      .query("dailyGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .collect();
    return dailies;
  },
});

export const hasAnyForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const dailies = await ctx.db
      .query("dailyGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(1);
    return dailies.length > 0;
  },
});
