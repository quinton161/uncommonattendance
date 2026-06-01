import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { hubIdMatchesScope, resolvedHubLabel } from './hubService';

export const NO_HUB_ASSIGNED_MSG =
  'No hub is assigned to this account. Ask your instructor or admin to set your hub before recording attendance.';

export const HUB_MISMATCH_MSG =
  'Attendance must be recorded for the student’s assigned hub only. Contact your hub admin if this looks wrong.';

/** Trim hub id; empty string means “unset” on the profile. */
export function canonicalHubId(hubId?: string | null): string {
  return hubId != null ? String(hubId).trim() : '';
}

/** True when two hub ids refer to the same hub (including legacy empty ↔ Victoria Falls). */
export function hubsAreSame(a?: string | null, b?: string | null): boolean {
  const left = a ?? undefined;
  const right = b ?? undefined;
  return hubIdMatchesScope(left, right) && hubIdMatchesScope(right, left);
}

/** Require a hub on the user profile before any attendance write. */
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

  const snap = await getDoc(doc(db, 'users', sid));
  if (!snap.exists()) throw new Error('Student profile not found.');

  const data = snap.data();
  const hubId = requireProfileHubId(data?.hubId);
  return {
    hubId,
    hubName: resolvedHubLabel({ hubId, hubName: data?.hubName }),
  };
}

/**
 * When the client sends a hub id (student dashboard), it must match the Firestore profile.
 * Staff should omit callerHubId and rely on the profile hub only.
 */
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
