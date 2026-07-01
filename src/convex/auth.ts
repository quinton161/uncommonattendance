import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";
import { Resend } from "resend";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Email({
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
          html: `<p>Your sign-in code is: <strong>${token}</strong></p><p>This code expires in 10 minutes.</p><p>If you didn't request this code, you can safely ignore this email.</p>`,
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
      return await ctx.db.insert("users", {
        email,
        emailLower: email?.toLowerCase(),
        userType: email?.toLowerCase().endsWith("@uncommon.org") ? "admin" : "attendee",
        createdAt: Date.now(),
        firstVisit: true,
      });
    },
  },
});
