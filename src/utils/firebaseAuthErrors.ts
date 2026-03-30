/** User-facing copy for Firebase Auth error codes (login, register, reset, Google). */
export function getFirebaseAuthErrorMessage(code: string | undefined, fallback = 'Something went wrong. Please try again.'): string {
  if (!code) return fallback;

  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'That email address doesn’t look valid.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/operation-not-allowed': 'This sign-in method isn’t enabled.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Pop-up was blocked. Allow pop-ups for this site.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.',
  };

  return messages[code] || fallback;
}
