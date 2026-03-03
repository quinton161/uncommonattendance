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

export const SCHOOL_LOCATION: LocationConfig = {
  name: 'School',
  latitude: -17.94121,
  longitude: 25.81941,
  radius: 0.005, // ~500m radius
  address: 'School Location'
};

// You can add multiple locations if needed
export const KNOWN_LOCATIONS: LocationConfig[] = [
  SCHOOL_LOCATION,
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
📍 To set exact school coordinates:

1. Go to Google Maps
2. Search for your school location or navigate to the exact location
3. Right-click on location and select "What's here?"
4. Copy coordinates (latitude, longitude)
5. Update SCHOOL_LOCATION coordinates in src/config/locationConfig.ts

Current coordinates: ${SCHOOL_LOCATION.latitude}, ${SCHOOL_LOCATION.longitude}
`);
