import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { hubIdMatchesScope, resolvedHubLabel } from './hubService';

export const NO_HUB_ASSIGNED_MSG =
  'No hub is assigned to this account. Ask your instructor or admin to set your hub before recording attendance.';

export const HUB_MISMATCH_MSG =
  'Attendance must be recorded for the student\u2019s assigned hub only. Contact your hub admin if this looks wrong.';

export function canonicalHubId(hubId?: string | null): string {
  return hubId != null ? String(hubId).trim() : '';
}

export function hubsAreSame(a?: string | null, b?: string | null): boolean {
  const left = a ?? undefined;
  const right = b ?? undefined;
  return hubIdMatchesScope(left, right) && hubIdMatchesScope(right, left);
}

export function requireProfileHubId(hubId?: string | null): string {
  const id = canonicalHubId(hubId);
  if (!id) throw new Error(NO_HUB_ASSIGNED_MSG);
  return id;
}

export async function fetchStudentHubProfile(
  studentId: string
): Promise<{ hubId: string; hubName: string }> {
  const sid = studentId?.trim();
  if (!sid) throw new Error('Student ID is required');

  const user = await convex.query(api.users.getUserById as any, { userId: sid as any }) as any;
  if (!user) {
    throw new Error(
      'Your profile was not found in the system. Please sign out and sign back in. ' +
      'If this keeps happening, contact your instructor or administrator.'
    );
  }

  const hubId = requireProfileHubId(user?.hubId);
  return { hubId, hubName: resolvedHubLabel({ hubId, hubName: user?.hubName }) };
}

export function assertCallerHubMatchesProfile(
  callerHubId: string | undefined,
  profileHubId: string
): void {
  const caller = canonicalHubId(callerHubId);
  if (!caller) return;
  if (!hubsAreSame(caller, profileHubId)) {
    throw new Error(HUB_MISMATCH_MSG);
  }
}
