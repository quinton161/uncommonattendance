import { action } from "./_generated/server";
import { v } from "convex/values";

"use node";

const DEFAULT_FROM = "Uncommon Attendance <notifications@uncommon.org>";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
    from: v.optional(v.string()),
  },
  handler: async (_, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not set");
      return { success: false, error: "RESEND_API_KEY not configured" };
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: args.from || DEFAULT_FROM,
          to: [args.to],
          subject: args.subject,
          html: args.html,
          text: args.text,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Resend API error:", res.status, err);
        return { success: false, error: `Resend API error: ${res.status} ${err}` };
      }

      const data = await res.json();
      return { success: true, id: data.id };
    } catch (err: any) {
      console.error("Resend send failed:", err);
      return { success: false, error: err.message };
    }
  },
});
