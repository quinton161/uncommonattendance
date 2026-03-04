/**
 * Location Configuration for Vincent Bohlen Hub
 */

export const ALLOWED_WIFI_IP = '74.244.195.215'; // Your current public IP

export interface LocationConfig {
  name: string;
  address?: string;
}

export const SCHOOL_LOCATION: LocationConfig = {
  name: 'School',
  address: 'School Hub'
};

/**
 * Check if the user's current public IP matches the allowed school WiFi IP
 */
export function isOnSchoolWifi(userIp: string): boolean {
  return userIp === ALLOWED_WIFI_IP;
}

export function getLocationDisplayName(location: LocationConfig): string {
  return location.address || location.name;
}

// Instructions for finding exact IP:
console.log(`
📍 To set exact school IP:

1. Go to a website that displays your public IP (e.g. whatismyip.com)
2. Copy your public IP
3. Update ALLOWED_WIFI_IP in src/config/locationConfig.ts

Current IP: ${ALLOWED_WIFI_IP}
`);
