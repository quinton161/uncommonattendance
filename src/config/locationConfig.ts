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
  latitude: -17.9421,
  longitude: 25.8234,
  radius: 200,
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

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineDistanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function findKnownLocationWithAccuracy(latitude: number, longitude: number, accuracyMeters: number = 0): LocationConfig | null {
  for (const location of KNOWN_LOCATIONS) {
    const distanceMeters = haversineDistanceMeters(
      { latitude, longitude },
      { latitude: location.latitude, longitude: location.longitude }
    );

    if (distanceMeters <= location.radius + Math.max(0, accuracyMeters)) {
      return location;
    }
  }

  return null;
}

/**
 * Check if coordinates match any known location
 */
export function findKnownLocation(latitude: number, longitude: number): LocationConfig | null {
  return findKnownLocationWithAccuracy(latitude, longitude, 0);
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
