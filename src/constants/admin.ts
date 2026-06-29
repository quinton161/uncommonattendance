/** Primary admin account — must match AuthContext / Convex role logic. */
export const ADMIN_EMAIL = 'quintonndlovu161@gmail.com';

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email?.trim().toLowerCase() ?? '') === ADMIN_EMAIL;
}
