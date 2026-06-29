import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const log = mutation({
  args: {
    adminId: v.string(),
    adminName: v.string(),
    action: v.string(),
    targetUserId: v.string(),
    targetUserName: v.string(),
    details: v.optional(v.any()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("admin_actions", {
      adminId: args.adminId,
      adminName: args.adminName,
      actionType: "attendance",
      action: args.action,
      targetUserId: args.targetUserId,
      targetUserName: args.targetUserName,
      details: args.details,
      date: args.date || "",
      createdAt: Date.now(),
    });
  },
});

export const listRecent = query({
  args: { limitCount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limitCount ?? 50;
    return await ctx.db
      .query("admin_actions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

export const cleanupOrphanedAttendance = mutation({
  args: {},
  handler: async (ctx) => {
    const allAttendance = await ctx.db.query("attendance").collect();
    let deletedCount = 0;
    
    for (const record of allAttendance) {
      if (record.studentId) {
        // Check if student exists
        const student = await ctx.db.get(record.studentId as any);
        if (!student) {
          await ctx.db.delete(record._id);
          deletedCount++;
        }
      }
    }
    
    // Also clean up dailyAttendance if it exists
    const allDaily = await ctx.db.query("dailyAttendance").collect();
    for (const record of allDaily) {
      if (record.studentId) {
        const student = await ctx.db.get(record.studentId as any);
        if (!student) {
          await ctx.db.delete(record._id);
          deletedCount++;
        }
      }
    }
    
    return { deletedCount };
  },
});
