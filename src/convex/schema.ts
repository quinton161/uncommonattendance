import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.string(),
    emailLower: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    userType: v.string(),
    hubId: v.optional(v.string()),
    hubName: v.optional(v.string()),
    bio: v.optional(v.string()),
    course: v.optional(v.string()),
    profession: v.optional(v.string()),
    status: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    profileImageUrl: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
  }).index("by_clerkId", ["clerkId"]).index("by_emailLower", ["emailLower"]),

  weeklyGoals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    weekStart: v.string(),
    weekEnd: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  dailyGoals: defineTable({
    weeklyGoalId: v.id("weeklyGoals"),
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_weeklyGoalId", ["weeklyGoalId"]).index("by_userId", ["userId"]),

  notifications: defineTable({
    type: v.string(),
    title: v.string(),
    body: v.string(),
    hubId: v.optional(v.string()),
    hubName: v.optional(v.string()),
    studentId: v.optional(v.string()),
    studentName: v.optional(v.string()),
    readBy: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  hubs: defineTable({
    name: v.string(),
    city: v.optional(v.string()),
    order: v.number(),
    status: v.optional(v.string()),
    location: v.optional(v.string()),
  }).index("by_order", ["order"]),

  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    date: v.string(),
    location: v.string(),
    instructorId: v.string(),
    instructorName: v.optional(v.string()),
    capacity: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    isPublic: v.boolean(),
    eventStatus: v.string(),
    hubId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_date", ["date"]).index("by_instructorId", ["instructorId"]),

  ticketTypes: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    price: v.number(),
    quantity: v.number(),
    description: v.optional(v.string()),
    accessLevel: v.optional(v.string()),
  }).index("by_eventId", ["eventId"]),

  registrations: defineTable({
    eventId: v.id("events"),
    studentId: v.id("users"),
    ticketTypeId: v.optional(v.id("ticketTypes")),
    status: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_studentId", ["studentId"]).index("by_eventId", ["eventId"]),

  feedback: defineTable({
    eventId: v.id("events"),
    studentId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_eventId", ["eventId"]),

  eventResources: defineTable({
    eventId: v.id("events"),
    title: v.string(),
    resourceType: v.optional(v.string()),
    url: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    description: v.optional(v.string()),
    accessLevel: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_eventId", ["eventId"]),

  attendance: defineTable({
    studentId: v.id("users"),
    studentName: v.optional(v.string()),
    date: v.string(),
    checkInTime: v.number(),
    checkOutTime: v.optional(v.number()),
    hubId: v.optional(v.string()),
    status: v.string(),
    method: v.optional(v.string()),
    lateReason: v.optional(v.string()),
    checkInGoal: v.optional(v.string()),
    absenceReason: v.optional(v.string()),
    absenceNotes: v.optional(v.string()),
    recordedByUid: v.optional(v.string()),
    recordedByName: v.optional(v.string()),
    checkOutMethod: v.optional(v.string()),
    checkOutByUid: v.optional(v.string()),
    location: v.optional(v.object({
      ip: v.optional(v.string()),
      timestamp: v.optional(v.number()),
    })),
  }).index("by_studentId", ["studentId"]).index("by_date", ["date"]).index("by_checkInTime", ["checkInTime"]),

  dailyAttendance: defineTable({
    studentId: v.id("users"),
    studentName: v.optional(v.string()),
    date: v.string(),
    status: v.string(),
    hubId: v.optional(v.string()),
    hubName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_studentId", ["studentId"]).index("by_date", ["date"]),

  late_check_in_events: defineTable({
    studentId: v.id("users"),
    date: v.string(),
    reason: v.string(),
    createdAt: v.number(),
  }).index("by_studentId", ["studentId"]),

  conversations: defineTable({
    studentId: v.id("users"),
    instructorId: v.id("users"),
    topic: v.string(),
    createdAt: v.number(),
  }).index("by_studentId", ["studentId"]).index("by_instructorId", ["instructorId"]),

  admin_actions: defineTable({
    adminId: v.string(),
    adminName: v.optional(v.string()),
    actionType: v.optional(v.string()),
    action: v.string(),
    targetId: v.optional(v.string()),
    targetUserId: v.optional(v.string()),
    targetUserName: v.optional(v.string()),
    details: v.optional(v.any()),
    date: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  appUpdates: defineTable({
    seq: v.number(),
    title: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_seq", ["seq"]),

  system_config: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  monthlyAwards: defineTable({
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
    computedAt: v.number(),
  }).index("by_period", ["period"]),

  checkoutGoalLogs: defineTable({
    userId: v.id("users"),
    date: v.string(),
    dailyAchieved: v.string(),
    dailyNote: v.string(),
    isFriday: v.boolean(),
    weeklyAchieved: v.optional(v.string()),
    weeklyReflection: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]).index("by_date", ["date"]),
});
