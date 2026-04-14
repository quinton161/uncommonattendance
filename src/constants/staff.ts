/** Uncommon staff / instructor Google & email domain — must not register as students. */
export const UNCOMMON_ORG_EMAIL_SUFFIX = '@uncommon.org';

export function isUncommonOrgStaffEmail(email: string | null | undefined): boolean {
  const e = email?.trim().toLowerCase() ?? '';
  return e.endsWith(UNCOMMON_ORG_EMAIL_SUFFIX);
}
