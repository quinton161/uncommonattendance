/** Primary admin account — must match AuthContext / Convex role logic. */
export const ADMIN_EMAIL = 'quinton.ndlovu@uncommon.org';

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email?.trim().toLowerCase() ?? '') === ADMIN_EMAIL;
}
