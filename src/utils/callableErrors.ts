/**
 * Returns a user-friendly error message from a Clerk or Convex callable error.
 */
export function getAuthOrCallableErrorMessage(error: unknown, fallbackMessage = 'An unknown error occurred.'): string {
  if (!error) return fallbackMessage;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  const e = error as any;
  if (e?.errors?.[0]?.longMessage) return e.errors[0].longMessage;
  if (e?.errors?.[0]?.message) return e.errors[0].message;
  if (e?.message) return e.message;
  return fallbackMessage;
}
