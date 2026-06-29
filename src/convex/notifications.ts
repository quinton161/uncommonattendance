import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    body: v.string(),
    hubId: v.optional(v.string()),
    hubName: v.optional(v.string()),
    studentId: v.optional(v.string()),
    studentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      type: args.type,
      title: args.title.trim(),
      body: args.body.trim(),
      hubId: args.hubId?.trim() || "",
      hubName: args.hubName?.trim() || "",
      studentId: args.studentId?.trim() || "",
      studentName: args.studentName?.trim() || "",
      readBy: [],
      createdAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    uid: v.string(),
  },
  handler: async (ctx, args) => {
    const notif = await ctx.db.get(args.notificationId);
    if (!notif) return;
    if (!notif.readBy.includes(args.uid)) {
      await ctx.db.patch(args.notificationId, {
        readBy: [...notif.readBy, args.uid],
      });
    }
  },
});

export const listRecent = query({
  args: { limitCount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limitCount ?? 40;
    return await ctx.db
      .query("notifications")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});
