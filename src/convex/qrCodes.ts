import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateRandomCode(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const getOrCreate = mutation({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("system_config")
      .withIndex("by_key", (q) => q.eq("key", "daily_qr_code"))
      .first();

    if (existing && (existing.value as any)?.date === args.today) {
      return existing.value as { code: string; date: string; createdAt: number };
    }

    const newCode = generateRandomCode();
    const qrData = {
      code: newCode,
      date: args.today,
      createdAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, { value: qrData });
    } else {
      await ctx.db.insert("system_config", { key: "daily_qr_code", value: qrData });
    }

    return qrData;
  },
});

export const getCurrent = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("system_config")
      .withIndex("by_key", (q) => q.eq("key", "daily_qr_code"))
      .first();

    if (existing) {
      const val = existing.value as { code: string; date: string };
      if (val.date === args.today) return val;
    }
    return null;
  },
});

export const validate = query({
  args: { code: v.string(), today: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("system_config")
      .withIndex("by_key", (q) => q.eq("key", "daily_qr_code"))
      .first();

    if (!existing) return false;
    const val = existing.value as { code: string; date: string };
    return val.date === args.today && val.code.toUpperCase() === args.code.toUpperCase();
  },
});
