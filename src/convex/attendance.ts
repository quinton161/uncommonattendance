import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const checkIn = mutation({
  args: {
    studentId: v.id("users"),
    studentName: v.string(),
    date: v.string(),
    hubId: v.optional(v.string()),
    status: v.string(),
    method: v.string(),
    lateReason: v.optional(v.string()),
    checkInGoal: v.optional(v.string()),
    location: v.optional(v.object({
      ip: v.optional(v.string()),
      timestamp: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (existing) {
      throw new Error("Already checked in today");
    }

    const checkInTime = Date.now();

    const recordId = await ctx.db.insert("attendance", {
      studentId: args.studentId,
      studentName: args.studentName,
      date: args.date,
      checkInTime,
      hubId: args.hubId,
      status: args.status,
      method: args.method,
      lateReason: args.lateReason,
      checkInGoal: args.checkInGoal,
      location: args.location,
    });

    if (args.status === "late" && args.lateReason) {
      await ctx.db.insert("late_check_in_events", {
        studentId: args.studentId,
        date: args.date,
        reason: args.lateReason,
        createdAt: checkInTime,
      });
    }

    return recordId;
  },
});

export const checkOut = mutation({
  args: {
    studentId: v.id("users"),
    date: v.string(),
    hubId: v.optional(v.string()),
    checkOutMethod: v.string(),
    location: v.optional(v.object({
      ip: v.optional(v.string()),
      timestamp: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (!existing) {
      throw new Error("No check-in record found for today");
    }

    if (existing.checkOutTime) {
      throw new Error("Already checked out today");
    }

    await ctx.db.patch(existing._id, {
      checkOutTime: Date.now(),
      status: "completed",
      checkOutMethod: args.checkOutMethod,
    });

    return existing._id;
  },
});

export const getTodayAttendance = query({
  args: { studentId: v.id("users"), date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();
  },
});

export const getAttendanceHistory = query({
  args: { studentId: v.id("users"), limitCount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();
    if (args.limitCount) return records.slice(0, args.limitCount);
    return records;
  },
});

export const getAllTodayAttendance = query({
  args: { date: v.string(), hubId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let records = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .order("desc")
      .collect();
    if (args.hubId) {
      records = records.filter((r) => r.hubId === args.hubId);
    }
    return records;
  },
});

export const getCurrentlyPresentStudents = query({
  args: { date: v.string(), hubId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let records = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    if (args.hubId) {
      records = records.filter((r) => r.hubId === args.hubId);
    }
    return records.filter((r) => r.checkInTime && !r.checkOutTime);
  },
});

export const unmarkPresentForDate = mutation({
  args: { studentId: v.id("users"), date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      const daily = await ctx.db
        .query("dailyAttendance")
        .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
        .filter((q) => q.eq(q.field("date"), args.date))
        .first();
      if (daily) await ctx.db.delete(daily._id);
      return true;
    }
    return false;
  },
});

export const recordStaffAbsent = mutation({
  args: {
    studentId: v.id("users"),
    date: v.string(),
    hubId: v.optional(v.string()),
    reason: v.string(),
    notes: v.optional(v.string()),
    recordedByUid: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (existing) {
      if (existing.checkInTime) {
        throw new Error("This student already checked in for this date.");
      }
      await ctx.db.patch(existing._id, {
        status: "absent",
        method: "staff_absent",
        absenceReason: args.reason,
        absenceNotes: args.notes,
        recordedByUid: args.recordedByUid,
      });
    } else {
      await ctx.db.insert("attendance", {
        studentId: args.studentId,
        date: args.date,
        checkInTime: 0,
        status: "absent",
        method: "staff_absent",
        absenceReason: args.reason,
        absenceNotes: args.notes,
        recordedByUid: args.recordedByUid,
        hubId: args.hubId,
      });
    }
  },
});

export const getAttendanceByDateRange = query({
  args: { startDate: v.string(), endDate: v.string(), studentId: v.optional(v.string()), hubId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let records = await ctx.db
      .query("attendance")
      .filter((q) => q.and(
        q.gte(q.field("date"), args.startDate),
        q.lte(q.field("date"), args.endDate),
      ))
      .collect();
    if (args.studentId) {
      records = records.filter((r) => r.studentId === args.studentId);
    }
    if (args.hubId) {
      records = records.filter((r) => r.hubId === args.hubId);
    }
    return records;
  },
});

export const masterResetAttendance = mutation({
  args: { hubId: v.string() },
  handler: async (ctx, args) => {
    let deletedCount = 0;
    let deletedDaily = 0;

    const attendanceRecords = await ctx.db
      .query("attendance")
      .collect();

    for (const record of attendanceRecords) {
      if (record.hubId === args.hubId) {
        await ctx.db.delete(record._id);
        deletedCount++;
      }
    }

    const dailyRecords = await ctx.db
      .query("dailyAttendance")
      .collect();

    for (const record of dailyRecords) {
      if (record.hubId === args.hubId) {
        await ctx.db.delete(record._id);
        deletedDaily++;
      }
    }

    return { deletedCount, deletedDaily };
  },
});

