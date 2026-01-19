/**
 * Location Configuration for Vincent Bohlen Hub
 * Update these coordinates with the exact location of your hub
 */

export interface LocationConfig {
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in decimal degrees (approximately 0.01 = ~1km)
  address?: string;
}

export const VINCENT_BOHLEN_HUB: LocationConfig = {
  name: 'Vincent Bohlen Hub',
  // TODO: Replace these with actual Vincent Bohlen Hub coordinates
  latitude: -26.2041,  // Example coordinates (Johannesburg area)
  longitude: 28.0473,  // Example coordinates (Johannesburg area)
  radius: 0.01,        // ~1km radius - adjust as needed
  address: 'Vincent Bohlen Hub, South Africa'
};

// You can add multiple locations if needed
export const KNOWN_LOCATIONS: LocationConfig[] = [
  VINCENT_BOHLEN_HUB,
  // Add more locations here if needed
  // {
  //   name: 'Other Campus',
  //   latitude: -26.1234,
  //   longitude: 28.5678,
  //   radius: 0.005,
  //   address: 'Other Campus Location'
  // }
];

/**
 * Check if coordinates match any known location
 */
export function findKnownLocation(latitude: number, longitude: number): LocationConfig | null {
  for (const location of KNOWN_LOCATIONS) {
    const distance = Math.sqrt(
      Math.pow(latitude - location.latitude, 2) + 
      Math.pow(longitude - location.longitude, 2)
    );
    
    if (distance <= location.radius) {
      return location;
    }
  }
  
  return null;
}

/**
 * Get the display name for a location
 */
export function getLocationDisplayName(location: LocationConfig): string {
  return location.address || location.name;
}

// Instructions for finding exact coordinates:
console.log(`
📍 To set exact Vincent Bohlen Hub coordinates:

1. Go to Google Maps
2. Search for "Vincent Bohlen Hub" or navigate to the exact location
3. Right-click on the location and select "What's here?"
4. Copy the coordinates (latitude, longitude)
5. Update the VINCENT_BOHLEN_HUB coordinates in src/config/locationConfig.ts

Current coordinates: ${VINCENT_BOHLEN_HUB.latitude}, ${VINCENT_BOHLEN_HUB.longitude}
`);
