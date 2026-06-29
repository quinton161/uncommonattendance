import { query } from "./_generated/server";
import { v } from "convex/values";

const FALLBACK_HUBS = [
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
  {
    id: 'uncommon_gokwe',
    name: 'Gokwe Innovation Hub',
    city: 'Gokwe',
    location: 'Gokwe',
    order: 11,
  },
  {
    id: 'uncommon_chitungwiza',
    name: 'Chitungwiza Innovation Hub',
    city: 'Chitungwiza',
    location: 'Chitungwiza',
    order: 12,
  },
  {
    id: 'uncommon_sizinda_byo',
    name: 'Sizinda Innovation Hub',
    city: 'Bulawayo',
    location: 'Sizinda, BYO',
    order: 13,
  },
];

export const get = query({
  args: {},
  handler: async (ctx) => {
    const remoteHubs = await ctx.db.query("hubs").order("asc").collect();
    
    // Merge logic: key by name since seeded hubs and fallback hubs share names.
    // This avoids duplication caused by keying remote hubs by Convex _id
    // and fallback hubs by canonical string id (which never match).
    const byName = new Map<string, any>();
    
    FALLBACK_HUBS.forEach((h) => byName.set(h.name, { ...h }));
    
    remoteHubs.forEach((h) => {
      if (byName.has(h.name)) {
        const existing = byName.get(h.name);
        byName.set(h.name, { ...existing, ...h, id: existing.id });
      } else {
        byName.set(h.name, { ...h, id: h._id });
      }
    });
    
    return Array.from(byName.values()).sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name)
    );
  },
});
