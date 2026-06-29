import { ConvexReactClient } from "convex/react";

// Initialize Convex React Client for use outside of React components
export const convex = new ConvexReactClient(
  process.env.REACT_APP_CONVEX_URL || "https://happy-animal-123.convex.cloud"
);
