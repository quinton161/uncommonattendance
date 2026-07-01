import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_emailLower", (q) => q.eq("emailLower", identity.email!.toLowerCase()))
      .unique();
    return user;
  },
});

export const storeUser = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    hubId: v.optional(v.string()),
    hubName: v.optional(v.string()),
    userType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_emailLower", (q) => q.eq("emailLower", args.email.toLowerCase()))
      .unique();

    if (existingUser) {
      const patch: any = {
        email: args.email,
        emailLower: args.email.toLowerCase(),
        displayName: args.displayName || existingUser.displayName,
        profileImageUrl: existingUser.profileImageUrl || args.photoUrl,
        updatedAt: Date.now(),
      };

      if (!existingUser.hubId && args.hubId) {
        patch.hubId = args.hubId;
        patch.hubName = args.hubName;
      }
      if (!existingUser.userType && args.userType) {
        patch.userType = args.userType;
      }
      if (args.email.toLowerCase().endsWith("@uncommon.org")) {
        patch.userType = "admin";
      }

      await ctx.db.patch(existingUser._id, patch);
      return existingUser._id;
    }

    let userType = args.userType || "attendee";
    if (args.email.toLowerCase().endsWith("@uncommon.org")) {
      userType = "admin";
    }

    return await ctx.db.insert("users", {
      email: args.email,
      emailLower: args.email.toLowerCase(),
      displayName: args.displayName,
      profileImageUrl: args.photoUrl,
      userType,
      hubId: args.hubId,
      hubName: args.hubName,
      createdAt: Date.now(),
      firstVisit: true,
    });
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    hubId: v.optional(v.string()),
    hubName: v.optional(v.string()),
    userType: v.optional(v.string()),
    course: v.optional(v.string()),
    profession: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db.get(args.userId);
    if (!user || user.email.toLowerCase() !== identity.email!.toLowerCase()) {
      throw new Error("Unauthorized");
    }

    const { userId, photoUrl, ...updates } = args;
    if (photoUrl !== undefined) (updates as any).profileImageUrl = photoUrl;
    await ctx.db.patch(userId, updates);
  },
});

export const adminUpdateUser = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    hubId: v.optional(v.string()),
    hubName: v.optional(v.string()),
    userType: v.optional(v.string()),
    course: v.optional(v.string()),
    profession: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_emailLower", (q) => q.eq("emailLower", identity.email!.toLowerCase()))
      .unique();
    if (!adminUser || (adminUser.userType !== "admin" && adminUser.userType !== "instructor")) {
      throw new Error("Unauthorized");
    }
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, updates);
  },
});

export const clearFirstVisit = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const user = await ctx.db
      .query("users")
      .withIndex("by_emailLower", (q) => q.eq("emailLower", identity.email!.toLowerCase()))
      .unique();
    if (user && user.firstVisit) {
      await ctx.db.patch(user._id, { firstVisit: false });
    }
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_emailLower", (q) => q.eq("emailLower", identity.email!.toLowerCase()))
      .unique();
    if (!adminUser) throw new Error("Unauthorized");
    if (adminUser.email.toLowerCase() !== "quinton.ndlovu@uncommon.org") {
      throw new Error("Only the main administrator can delete accounts.");
    }

    await ctx.db.delete(args.userId);
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUsersByType = query({
  args: { userType: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return users.filter((u) => u.userType === args.userType);
  },
});
