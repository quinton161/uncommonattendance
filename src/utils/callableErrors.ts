import { getFirebaseAuthErrorMessage } from './firebaseAuthErrors';

/** Extract Firebase / Cloud Functions error code from unknown thrown values. */
export function getErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: string }).code;
    return code ? String(code) : undefined;
  }
  return undefined;
}

/** User-facing message for Auth + callable errors (password reset prep, etc.). */
export function getAuthOrCallableErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const code = getErrorCode(err);
  if (code === 'functions/resource-exhausted') {
    return 'Too many reset attempts for this email. Wait about 15 minutes and try again.';
  }
  if (code === 'functions/unavailable' || code === 'functions/deadline-exceeded') {
    return 'Password reset service is temporarily unavailable. Try again in a few minutes or ask your instructor.';
  }
  if (code === 'functions/internal' || code === 'functions/unknown') {
    return 'Could not prepare password reset. Try again or contact support.';
  }
  return getFirebaseAuthErrorMessage(code, fallback);
}
