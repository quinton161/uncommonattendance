import { mutation } from "./_generated/server";

const DEFAULT_HUBS = [
  { name: 'Nicki Keszler Innovation Hub', city: 'Harare', location: 'Kuwadzana 6 Primary School', order: 1 },
  { name: 'Dzikwa Trust Innovation Hub', city: 'Harare', location: 'Dzivarasekwa', order: 2 },
  { name: 'Mufakose Innovation Hub', city: 'Harare', location: 'Gwinyiro Primary School', order: 3 },
  { name: 'Warren Park Innovation Hub', city: 'Harare', location: 'Warren Park 2 Primary School', order: 4 },
  { name: 'Kambuzuma Innovation Hub', city: 'Harare', location: 'Kambuzuma', order: 5 },
  { name: 'Mbare Innovation Hub', city: 'Harare', location: 'Mbare', order: 6 },
  { name: 'Nedbank Innovation Hub', city: 'Bulawayo', location: "Emganwini, hosted by Zara's Center", order: 7 },
  { name: 'Vincent Bohlen Innovation Hub', city: 'Victoria Falls', location: 'Chamabondo Primary School', order: 8 },
  { name: 'Gwayi Innovation Hub', city: 'Matabeleland North', location: 'Gwayi', order: 9 },
  { name: 'Jafuta Innovation Hub', city: 'Victoria Falls', location: 'Jafuta', order: 10 },
  { name: 'Gokwe Innovation Hub', city: 'Gokwe', location: 'Gokwe', order: 11 },
  { name: 'Chitungwiza Innovation Hub', city: 'Chitungwiza', location: 'Chitungwiza', order: 12 },
  { name: 'Sizinda Innovation Hub', city: 'Bulawayo', location: 'Sizinda, BYO', order: 13 },
];

export const seedHubs = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete existing hubs to avoid duplicates
    const existing = await ctx.db.query("hubs").collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }
    
    // Insert fresh hubs
    for (const hub of DEFAULT_HUBS) {
      await ctx.db.insert("hubs", {
        name: hub.name,
        city: hub.city,
        location: hub.location,
        order: hub.order,
        status: "active"
      });
    }
    return "Successfully seeded " + DEFAULT_HUBS.length + " hubs into Convex!";
  },
});
