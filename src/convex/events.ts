import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    location: v.string(),
    instructorId: v.string(),
    instructorName: v.optional(v.string()),
    capacity: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    isPublic: v.boolean(),
    eventStatus: v.string(),
    hubId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", {
      ...args,
      date: args.startDate,
      createdAt: Date.now(),
    });
  },
});

export const updateEvent = mutation({
  args: { eventId: v.id("events"), updates: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, args.updates);
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.eventId);
  },
});

export const getEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;
    return { ...event, id: event._id };
  },
});

export const getUserEvents = query({
  args: { instructorId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("events").collect();
    return events
      .filter((e) => e.instructorId === args.instructorId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((e) => ({ ...e, id: e._id }));
  },
});

export const getPublicEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    return events
      .filter((e) => e.isPublic && e.eventStatus === "published")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 50)
      .map((e) => ({ ...e, id: e._id }));
  },
});

export const getAllEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").order("desc").collect();
    return events.map((e) => ({ ...e, id: e._id }));
  },
});

export const registerForEvent = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    ticketTypeId: v.optional(v.id("ticketTypes")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("registrations", {
      studentId: args.userId,
      eventId: args.eventId,
      ticketTypeId: args.ticketTypeId,
      status: "pending",
      notes: args.notes || "",
      createdAt: Date.now(),
    });
  },
});

export const cancelRegistration = mutation({
  args: { registrationId: v.id("registrations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.registrationId, { status: "cancelled" });
  },
});

export const getUserRegistrations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.userId))
      .order("desc")
      .collect();
    return registrations.map((r) => ({ ...r, id: r._id }));
  },
});

export const getEventRegistrations = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();
    return registrations.map((r) => ({ ...r, id: r._id }));
  },
});

export const createTicketType = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    price: v.number(),
    quantity: v.number(),
    description: v.optional(v.string()),
    accessLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ticketTypes", {
      eventId: args.eventId,
      name: args.name,
      price: args.price,
      quantity: args.quantity,
      description: args.description,
      accessLevel: args.accessLevel,
    });
  },
});

export const getEventTicketTypes = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ticketTypes")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

export const submitFeedback = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("feedback", {
      studentId: args.userId,
      eventId: args.eventId,
      rating: args.rating,
      comment: args.comment || "",
      createdAt: Date.now(),
    });
  },
});

export const getEventFeedback = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("feedback")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();
  },
});

export const addEventResource = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    resourceType: v.optional(v.string()),
    url: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    description: v.optional(v.string()),
    accessLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("eventResources", {
      eventId: args.eventId,
      title: args.title,
      resourceType: args.resourceType,
      url: args.url,
      fileId: args.fileId,
      description: args.description,
      accessLevel: args.accessLevel,
      createdAt: Date.now(),
    });
  },
});

export const getEventResources = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventResources")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();
  },
});
