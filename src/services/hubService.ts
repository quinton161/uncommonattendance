import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import type { User } from '../types';

export const LEGACY_DEFAULT_HUB_ID = 'uncommon_victoriafalls';

export function hubIdMatchesScope(
  recordHubId: string | undefined | null,
  scopeHubId: string | undefined
): boolean {
  if (!scopeHubId) return true;
  const r = (recordHubId && String(recordHubId).trim()) || '';
  if (r === scopeHubId) return true;
  if (scopeHubId === LEGACY_DEFAULT_HUB_ID && !r) return true;
  return false;
}

export function hubScopeForStaff(user: User | null): string | undefined {
  if (!user || user.userType === 'admin' || user.userType === 'instructor') return undefined;
  return user.hubId?.trim() || LEGACY_DEFAULT_HUB_ID;
}

export function effectiveStaffHubScope(user: User | null, adminHubFilter: string): string | undefined {
  if (!user) return undefined;
  if (user.userType === 'instructor') return instructorAssignedHubId(user);
  if (user.userType === 'admin') {
    const id = adminHubFilter?.trim();
    return id || undefined;
  }
  return user.hubId?.trim() || LEGACY_DEFAULT_HUB_ID;
}

export function effectiveStudentHubId(user: User | null | undefined): string {
  if (!user) return LEGACY_DEFAULT_HUB_ID;
  return user.hubId?.trim() || LEGACY_DEFAULT_HUB_ID;
}

export function instructorAssignedHubId(user: User | null | undefined): string {
  if (!user || user.userType !== 'instructor') return LEGACY_DEFAULT_HUB_ID;
  return user.hubId?.trim() || LEGACY_DEFAULT_HUB_ID;
}

export function initialStaffHubFilter(user: User | null | undefined): string {
  return user?.userType === 'instructor' ? instructorAssignedHubId(user) : '';
}

export function staffMayAccessHubForWrite(
  staffUser: User | null | undefined,
  recordHubId: string | null | undefined
): boolean {
  if (!staffUser) return false;
  if (staffUser.userType === 'admin') return true;
  if (staffUser.userType !== 'instructor') return false;
  return hubIdMatchesScope(recordHubId ?? undefined, instructorAssignedHubId(staffUser));
}

export interface Hub {
  id: string;
  name: string;
  city?: string;
  location?: string;
  order?: number;
}

export function hubLabel(h: Hub): string {
  return h.city ? `${h.name} (${h.city})` : h.name;
}

export function hubTooltip(h: Hub): string {
  const bits = [h.name];
  if (h.location) bits.push(h.location);
  if (h.city) bits.push(h.city);
  return bits.join(' — ');
}

const FALLBACK_HUBS: Hub[] = [
  { id: 'uncommon_kuwadzana', name: 'Nicki Keszler Innovation Hub', city: 'Harare', location: 'Kuwadzana 6 Primary School', order: 1 },
  { id: 'uncommon_dzivarasekwa', name: 'Dzikwa Trust Innovation Hub', city: 'Harare', location: 'Dzivarasekwa', order: 2 },
  { id: 'uncommon_mufakose', name: 'Mufakose Innovation Hub', city: 'Harare', location: 'Gwinyiro Primary School', order: 3 },
  { id: 'uncommon_warrenpark', name: 'Warren Park Innovation Hub', city: 'Harare', location: 'Warren Park 2 Primary School', order: 4 },
  { id: 'uncommon_kambuzuma', name: 'Kambuzuma Innovation Hub', city: 'Harare', location: 'Kambuzuma', order: 5 },
  { id: 'uncommon_mbare', name: 'Mbare Innovation Hub', city: 'Harare', location: 'Mbare', order: 6 },
  { id: 'uncommon_bulawayo', name: 'Nedbank Innovation Hub', city: 'Bulawayo', location: "Emganwini, hosted by Zara's Center", order: 7 },
  { id: 'uncommon_victoriafalls', name: 'Vincent Bohlen Innovation Hub', city: 'Victoria Falls', location: 'Chamabondo Primary School', order: 8 },
  { id: 'uncommon_gwayi', name: 'Gwayi Innovation Hub', city: 'Matabeleland North', location: 'Gwayi', order: 9 },
  { id: 'uncommon_jafuta', name: 'Jafuta Innovation Hub', city: 'Victoria Falls', location: 'Jafuta', order: 10 },
  { id: 'uncommon_gokwe', name: 'Gokwe Innovation Hub', city: 'Gokwe', location: 'Gokwe', order: 11 },
  { id: 'uncommon_chitungwiza', name: 'Chitungwiza Innovation Hub', city: 'Chitungwiza', location: 'Chitungwiza', order: 12 },
  { id: 'uncommon_sizinda_byo', name: 'Sizinda Innovation Hub', city: 'Bulawayo', location: 'Sizinda, BYO', order: 13 },
];

export const DEFAULT_HUBS: Hub[] = FALLBACK_HUBS;

export function mergeHubLists(remote: Hub[], canonical: Hub[]): Hub[] {
  const byId = new Map<string, Hub>();
  remote.forEach((h) => byId.set(h.id, { ...h }));
  canonical.forEach((h) => { if (!byId.has(h.id)) byId.set(h.id, { ...h }); });
  return Array.from(byId.values()).sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name)
  );
}

export function resolvedHubLabel(u: { hubId?: string; hubName?: string }): string {
  if (u.hubName?.trim()) return u.hubName.trim();
  const id = (u.hubId?.trim() as string) || LEGACY_DEFAULT_HUB_ID;
  const fromList = DEFAULT_HUBS.find((h) => h.id === id);
  if (fromList) return hubLabel(fromList);
  return id;
}

export async function fetchHubs(): Promise<Hub[]> {
  try {
    const remote = await convex.query(api.hubs.get as any) as any[];
    if (remote && remote.length > 0) return remote.map((h: any) => ({
      id: h.id || h._id,
      name: h.name,
      city: h.city,
      location: h.location,
      order: h.order,
    }));
    return FALLBACK_HUBS;
  } catch {
    return FALLBACK_HUBS;
  }
}
