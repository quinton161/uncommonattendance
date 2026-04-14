import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '../types';

/** Instructors see one hub; admins see all (no scope). */
export function hubScopeForStaff(user: User | null): string | undefined {
  if (!user || user.userType === 'admin') return undefined;
  return user.hubId;
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
  return user.hubId;
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
 * Eight Zimbabwe Innovation Hubs — doc IDs match suggested DB names (`uncommon_*`).
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
];

/** Same list as Firestore fallback — use so login/register never wait on an empty hub dropdown. */
export const DEFAULT_HUBS: Hub[] = FALLBACK_HUBS;

export async function fetchHubs(): Promise<Hub[]> {
  try {
    const q = query(collection(db, 'hubs'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) return FALLBACK_HUBS;
    return snap.docs.map((d) => {
      const data = d.data() as { name?: string; order?: number; city?: string; location?: string };
      return {
        id: d.id,
        name: data.name || d.id,
        city: data.city,
        location: data.location,
        order: data.order,
      };
    });
  } catch {
    try {
      const snap = await getDocs(collection(db, 'hubs'));
      if (snap.empty) return FALLBACK_HUBS;
      return snap.docs
        .map((d) => {
          const data = d.data() as { name?: string; order?: number; city?: string; location?: string };
          return {
            id: d.id,
            name: data.name || d.id,
            city: data.city,
            location: data.location,
            order: data.order ?? 0,
          };
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
    } catch {
      return FALLBACK_HUBS;
    }
  }
}
