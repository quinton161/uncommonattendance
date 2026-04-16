/** User-facing copy for Firebase Auth error codes (login, register, reset, Google). */
export function getFirebaseAuthErrorMessage(code: string | undefined, fallback = 'Something went wrong. Please try again.'): string {
  if (!code) return fallback;

  const messages: Record<string, string> = {
    'auth/invalid-credential':
      'That email and password did not match. Check for typos, try Forgot password, or use Create account if you have not registered yet. If an admin removed your profile but your login still exists, reset your password and sign in again.',
    'auth/user-not-found':
      'No account found with this email. Use Create account, or check the spelling of your address.',
    'auth/wrong-password':
      'Incorrect password. Use Forgot password if you are unsure, or confirm Caps Lock is off.',
    'auth/invalid-email': 'That email address doesn’t look valid.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/email-already-in-use':
      'This email is already registered. Use Sign in (not Create account), or Forgot password if needed.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/operation-not-allowed': 'This sign-in method isn’t enabled.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Pop-up was blocked. Allow pop-ups for this site.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.',
  };

  return messages[code] || fallback;
}

/**
 * Student-focused copy for the Sign In screen (primary audience: learners checking in).
 * Falls back to {@link getFirebaseAuthErrorMessage} for codes without a student variant.
 */
export function getStudentLoginAuthErrorMessage(code: string | undefined, fallback = 'Could not sign in.'): string {
  if (!code) return fallback;

  const studentLogin: Record<string, string> = {
    'auth/invalid-credential':
      'Wrong email, password, or hub. Pick the hub where you are enrolled, check spelling, then try again. Use Forgot password or Create account if you still need an account.',
    'auth/user-not-found':
      'No account with this email yet. Use Create account below, or fix a typo in your address.',
    'auth/wrong-password':
      'Wrong password. Tap Forgot password to reset it.',
    'auth/invalid-email': 'That email does not look valid.',
    'auth/user-disabled': 'This account is disabled. Ask your instructor or admin.',
    'auth/too-many-requests': 'Too many attempts. Wait a few minutes, then try again.',
    'auth/network-request-failed': 'Network problem. Check your connection and try again.',
  };

  if (studentLogin[code]) return studentLogin[code];
  return getFirebaseAuthErrorMessage(code, fallback);
}
