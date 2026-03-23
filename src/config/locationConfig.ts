/**
 * Location Configuration for Vincent Bohlen Hub
 * 
 * IMPORTANT: Location is now based on IP address only.
 * Geolocation coordinates are NOT stored to avoid device compatibility issues.
 */

// List of allowed public IP addresses for the school WiFi
// Add new IPs here if the school's dynamic IP changes
export const ALLOWED_WIFI_IPS = [
  '143.105.233.179', // Current IP (Mar 5, 2026)
  '74.244.195.215',  // Previous IP
];

// Check-in radius in meters (for future geolocation validation - currently not used)
export const CHECK_IN_RADIUS_METERS = 500;

// School coordinates (for reference only - not used for validation)
export const SCHOOL_COORDINATES = {
  latitude: -25.7479,  // Example: Pretoria area
  longitude: 28.2292
};

/**
 * Check if the user's current public IP matches any allowed school WiFi IP or range
 */
export function isOnSchoolWifi(userIp: string): boolean {
  // 1. Check exact matches
  if (ALLOWED_WIFI_IPS.includes(userIp)) return true;

  // 2. Check if IP starts with common school ISP prefixes (Broadening the check)
  // Most school networks stay within the same provider range
  const ipPrefix = userIp.split('.').slice(0, 2).join('.'); // e.g., "143.105"
  const allowedPrefixes = ALLOWED_WIFI_IPS
    .filter(ip => !ip.includes('/'))
    .map(ip => ip.split('.').slice(0, 2).join('.'));

  if (allowedPrefixes.includes(ipPrefix)) return true;

  return false;
}

// Instructions for finding exact IP:
console.log(`
📍 To set exact school IP:

1. Go to a website that displays your public IP (e.g. whatismyip.com)
2. Copy your public IP
3. Update ALLOWED_WIFI_IPS in src/config/locationConfig.ts

Current IPs: ${ALLOWED_WIFI_IPS.join(', ')}
`);
