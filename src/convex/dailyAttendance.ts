import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const markPresentToday = mutation({
  args: {
    studentId: v.id("users"),
    studentName: v.string(),
    hubId: v.id("hubs"),
    hubName: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyAttendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (!existing) {
      await ctx.db.insert("dailyAttendance", {
        studentId: args.studentId,
        date: args.date,
        status: "present",
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.patch(existing._id, { status: "present" });
    }
  },
});

export const markAbsent = mutation({
  args: {
    studentId: v.id("users"),
    studentName: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyAttendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (!existing) {
      await ctx.db.insert("dailyAttendance", {
        studentId: args.studentId,
        date: args.date,
        status: "absent",
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.patch(existing._id, { status: "absent" });
    }
  },
});

export const getDailyAttendance = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyAttendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();
  },
});
