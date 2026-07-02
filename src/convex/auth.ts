import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";
import { Resend } from "resend";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Email({
      id: "resend-otp",
      from: "Uncommon Attendance <noreply@uncommon.org>",
      maxAge: 10 * 60,
      generateVerificationToken: async () => {
        const digits = Math.floor(100000 + Math.random() * 900000).toString();
        return digits;
      },
      sendVerificationRequest: async ({ identifier: email, token }) => {
        const resend = new Resend(process.env.RESEND_API_KEY!);
        await resend.emails.send({
          from: "Uncommon Attendance <noreply@uncommon.org>",
          to: [email],
          subject: "Your Uncommon Attendance sign-in code",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#1e40af;margin-bottom:8px">Your sign-in code</h2>
              <p style="color:#374151;margin-bottom:24px">Use the code below to sign in to Uncommon Attendance.</p>
              <div style="background:#eff6ff;border:2px solid #93c5fd;border-radius:12px;padding:24px;text-align:center">
                <span style="font-size:2.5rem;font-weight:bold;letter-spacing:0.4em;color:#1e40af">${token}</span>
              </div>
              <p style="color:#6b7280;font-size:0.85rem;margin-top:16px">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      },
    }),
  ],
  callbacks: {
    createOrUpdateUser: async (ctx, args) => {
      if (args.existingUserId) {
        const { emailVerified, phoneVerified, ...safeProfile } = args.profile;
        await ctx.db.patch(args.existingUserId, {
          ...safeProfile,
          updatedAt: Date.now(),
        });
        return args.existingUserId;
      }
      const email = args.profile.email as string | undefined;
      if (!email) {
        throw new Error("Email is required for user creation");
      }
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_emailLower", (q) => q.eq("emailLower", email.toLowerCase()))
        .first();
      if (existingUser) {
        return existingUser._id;
      }
      return await ctx.db.insert("users", {
        email,
        emailLower: email.toLowerCase(),
        userType: email.toLowerCase().endsWith("@uncommon.org") ? "admin" : "attendee",
        createdAt: Date.now(),
        firstVisit: true,
      });
    },
  },
});
