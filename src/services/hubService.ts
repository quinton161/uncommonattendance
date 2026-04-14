import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '../types';

/**
 * Firestore doc id for Vincent Bohlen Innovation Hub (Victoria Falls).
 * Older deployment data often omits `hubId`; those rows are treated as this hub.
 */
export const LEGACY_DEFAULT_HUB_ID = 'uncommon_victoriafalls';

/**
 * Row/user belongs to a scoped hub if `hubId` matches, or the scope is the legacy
 * Vincent Bohlen hub and `hubId` is missing (pre–multi-hub data).
 */
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

/** Instructors see one hub; admins see all (no scope). Missing hubId → legacy Vincent Bohlen site. */
export function hubScopeForStaff(user: User | null): string | undefined {
  if (!user || user.userType === 'admin') return undefined;
  return user.hubId?.trim() || LEGACY_DEFAULT_HUB_ID;
}

/**
 * Admins may narrow lists to one hub (pass Firestore hub doc id) or leave empty for all hubs.
 * Instructors are always limited to their own `user.hubId`.
 */
export function effectiveStaffHubScope(user: User | null, adminHubFilter: string): string | undefined {
  if (!user) return undefined;
  if (user.userType === 'admin') {
    const id = adminHubFilter?.trim();
    return id || undefined;
  }
  return user.hubId?.trim() || LEGACY_DEFAULT_HUB_ID;
}

/** Students / attendees: stable Firestore hub id for attendance (missing profile hub → legacy default). */
export function effectiveStudentHubId(user: User | null | undefined): string {
  if (!user) return LEGACY_DEFAULT_HUB_ID;
  return user.hubId?.trim() || LEGACY_DEFAULT_HUB_ID;
}

export interface Hub {
  id: string;
  /** Official hub title (e.g. … Innovation Hub). */
  name: string;
  /** City: Harare, Bulawayo, Victoria Falls. */
  city?: string;
  /** School / venue / community detail (shown in tooltips and exports). */
  location?: string;
  order?: number;
}

/** One-line label for selects: "Nicki Keszler Innovation Hub (Harare)". */
export function hubLabel(h: Hub): string {
  return h.city ? `${h.name} (${h.city})` : h.name;
}

/** Full official line for `title` tooltips: hub — venue — city. */
export function hubTooltip(h: Hub): string {
  const bits = [h.name];
  if (h.location) bits.push(h.location);
  if (h.city) bits.push(h.city);
  return bits.join(' — ');
}

/**
 * Zimbabwe Innovation Hubs — doc IDs match suggested DB names (`uncommon_*`).
 * Source: Uncommon.org locations / published hubs. Override via Firestore `hubs` when ready.
 */
const FALLBACK_HUBS: Hub[] = [
  {
    id: 'uncommon_kuwadzana',
    name: 'Nicki Keszler Innovation Hub',
    city: 'Harare',
    location: 'Kuwadzana 6 Primary School',
    order: 1,
  },
  {
    id: 'uncommon_dzivarasekwa',
    name: 'Dzikwa Trust Innovation Hub',
    city: 'Harare',
    location: 'Dzivarasekwa',
    order: 2,
  },
  {
    id: 'uncommon_mufakose',
    name: 'Mufakose Innovation Hub',
    city: 'Harare',
    location: 'Gwinyiro Primary School',
    order: 3,
  },
  {
    id: 'uncommon_warrenpark',
    name: 'Warren Park Innovation Hub',
    city: 'Harare',
    location: 'Warren Park 2 Primary School',
    order: 4,
  },
  {
    id: 'uncommon_kambuzuma',
    name: 'Kambuzuma Innovation Hub',
    city: 'Harare',
    location: 'Kambuzuma',
    order: 5,
  },
  {
    id: 'uncommon_mbare',
    name: 'Mbare Innovation Hub',
    city: 'Harare',
    location: 'Mbare',
    order: 6,
  },
  {
    id: 'uncommon_bulawayo',
    name: 'Nedbank Innovation Hub',
    city: 'Bulawayo',
    location: "Emganwini, hosted by Zara's Center",
    order: 7,
  },
  {
    id: 'uncommon_victoriafalls',
    name: 'Vincent Bohlen Innovation Hub',
    city: 'Victoria Falls',
    location: 'Chamabondo Primary School',
    order: 8,
  },
  {
    id: 'uncommon_gwayi',
    name: 'Gwayi Innovation Hub',
    city: 'Matabeleland North',
    location: 'Gwayi',
    order: 9,
  },
  {
    id: 'uncommon_jafuta',
    name: 'Jafuta Innovation Hub',
    city: 'Victoria Falls',
    location: 'Jafuta',
    order: 10,
  },
];

/** Same list as Firestore fallback — use so login/register never wait on an empty hub dropdown. */
export const DEFAULT_HUBS: Hub[] = FALLBACK_HUBS;

/**
 * Firestore `hubs` can be a partial list. Merge so signup / hub pickers always include
 * every canonical hub (Gwayi, Jafuta, etc.); remote docs override name/city for matching ids.
 */
export function mergeHubLists(remote: Hub[], canonical: Hub[]): Hub[] {
  const byId = new Map<string, Hub>();
  remote.forEach((h) => byId.set(h.id, { ...h }));
  canonical.forEach((h) => {
    if (!byId.has(h.id)) byId.set(h.id, { ...h });
  });
  return Array.from(byId.values()).sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name)
  );
}

/** Label for lists/CSV when profile has no hub name saved. */
export function resolvedHubLabel(u: { hubId?: string; hubName?: string }): string {
  if (u.hubName?.trim()) return u.hubName.trim();
  const id = (u.hubId?.trim() as string) || LEGACY_DEFAULT_HUB_ID;
  const fromList = DEFAULT_HUBS.find((h) => h.id === id);
  if (fromList) return hubLabel(fromList);
  return id;
}

export async function fetchHubs(): Promise<Hub[]> {
  const mapDoc = (d: { id: string; data: () => Record<string, unknown> }): Hub => {
    const data = d.data() as { name?: string; order?: number; city?: string; location?: string };
    return {
      id: d.id,
      name: data.name || d.id,
      city: data.city,
      location: data.location,
      order: data.order,
    };
  };
  try {
    const q = query(collection(db, 'hubs'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) return FALLBACK_HUBS;
    const remote = snap.docs.map((d) => mapDoc(d));
    return mergeHubLists(remote, FALLBACK_HUBS);
  } catch {
    try {
      const snap = await getDocs(collection(db, 'hubs'));
      if (snap.empty) return FALLBACK_HUBS;
      const remote = snap.docs.map((d) => mapDoc(d));
      return mergeHubLists(remote, FALLBACK_HUBS);
    } catch {
      return FALLBACK_HUBS;
    }
  }
}
