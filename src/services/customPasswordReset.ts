/**
 * Password reset helpers — powered by Clerk's native SDK.
 *
 * Flow:
 *   1. requestPasswordReset(signIn, email)
 *      → Clerk sends a 6-digit code to the user's email
 *   2. confirmPasswordReset(signIn, code, newPassword)
 *      → Clerk verifies the code and applies the new password
 *
 * Components that need the full Clerk signIn handle can import useSignIn directly.
 * No external backend / REACT_APP_RESET_API_URL required.
 */

import { useSignIn } from '@clerk/clerk-react';

// Re-export so call-sites can import useSignIn from here if convenient
export { useSignIn };

/** Step 1 – ask Clerk to send a password-reset code email. */
export async function requestPasswordReset(
  signIn: ReturnType<typeof useSignIn>['signIn'],
  email: string
): Promise<void> {
  if (!signIn) throw new Error('Clerk is not ready. Please refresh and try again.');
  await signIn.create({
    identifier: email,
    strategy: 'reset_password_email_code',
  });
}

/** Step 2 – verify the code from the email and set the new password. */
export async function confirmPasswordReset(
  signIn: ReturnType<typeof useSignIn>['signIn'],
  code: string,
  newPassword: string
): Promise<{ createdSessionId: string | null }> {
  if (!signIn) throw new Error('Clerk is not ready. Please refresh and try again.');
  const result = await signIn.attemptFirstFactor({
    strategy: 'reset_password_email_code',
    code,
    password: newPassword,
  });
  return { createdSessionId: result.createdSessionId ?? null };
}

const CustomPasswordReset = { requestPasswordReset, confirmPasswordReset };
export default CustomPasswordReset;
