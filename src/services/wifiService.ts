import { uniqueToast } from '../utils/toastUtils';

export interface NetworkInfo {
  ssid: string;
  isUncommonNetwork: boolean;
  ipAddress?: string | null;
  connectionType?: string;
}

export class WiFiService {
  private static instance: WiFiService;
  private readonly UNCOMMON_SSID = 'Uncommon.org Innovation Hub';
  private readonly UNCOMMON_IP_RANGES = [
    '192.168.1.',    // Based on the provided IP: 192.168.1.192
    '10.0.0.',       // Common internal range
    '172.16.'        // Common internal range
  ];

  static getInstance(): WiFiService {
    if (!WiFiService.instance) {
      WiFiService.instance = new WiFiService();
    }
    return WiFiService.instance;
  }

  /**
   * Check if user is connected to Uncommon WiFi network
   */
  async isConnectedToUncommonWiFi(): Promise<boolean> {
    try {
      // Check multiple indicators of being on Uncommon network
      const checks = await Promise.allSettled([
        this.checkByNetworkAPI(),
        this.checkByIPAddress(),
        this.checkByDNS(),
        this.checkByLatency()
      ]);

      // If any check indicates Uncommon network, return true
      const results = checks.map(check => 
        check.status === 'fulfilled' ? check.value : false
      );

      const isUncommon = results.some(result => result === true);
      console.log('WiFi detection results:', { checks: results, isUncommon });
      
      return isUncommon;
    } catch (error) {
      console.error('Error checking WiFi connection:', error);
      return false;
    }
  }

  /**
   * Get detailed network information
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    const isUncommon = await this.isConnectedToUncommonWiFi();
    const ipAddress = await this.getLocalIPAddress();
    
    return {
      ssid: isUncommon ? this.UNCOMMON_SSID : 'Unknown Network',
      isUncommonNetwork: isUncommon,
      ipAddress,
      connectionType: this.getConnectionType()
    };
  }

  /**
   * Check using Network Information API (if available)
   */
  private async checkByNetworkAPI(): Promise<boolean> {
    try {
      // @ts-ignore - Network Information API is experimental
      if ('connection' in navigator) {
        // @ts-ignore
        const connection = (navigator as any).connection;
        
        // Check if we're on WiFi and effective type suggests good connection
        if (connection?.type === 'wifi' && 
            connection?.effectiveType && 
            ['4g', 'slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.log('Network API not available:', error);
      return false;
    }
  }

  /**
   * Check by attempting to get local IP address
   */
  private async checkByIPAddress(): Promise<boolean> {
    try {
      const ip = await this.getLocalIPAddress();
      if (!ip) return false;

      // Check if IP matches known Uncommon network ranges
      return this.UNCOMMON_IP_RANGES.some(range => ip.startsWith(range));
    } catch (error) {
      console.log('IP check failed:', error);
      return false;
    }
  }

  /**
   * Check by DNS resolution speed/pattern
   */
  private async checkByDNS(): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Try to resolve a local domain that might exist on Uncommon network
      const response = await fetch('/api/network-check', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      });
      
      const responseTime = Date.now() - startTime;
      
      // Fast response might indicate local network
      return responseTime < 100;
    } catch (error) {
      console.log('DNS check failed:', error);
      return false;
    }
  }

  /**
   * Check by network latency to known servers
   */
  private async checkByLatency(): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Ping a reliable external server
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      const latency = Date.now() - startTime;
      
      // Good latency might indicate quality network like Uncommon's
      return latency < 200 && response.ok;
    } catch (error) {
      console.log('Latency check failed:', error);
      return false;
    }
  }

  /**
   * Get local IP address using WebRTC
   */
  private async getLocalIPAddress(): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.createDataChannel('');
        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) {
              pc.close();
              resolve(ipMatch[1]);
              return;
            }
          }
        };

        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        
        // Timeout after 3 seconds
        setTimeout(() => {
          pc.close();
          resolve(null);
        }, 3000);
        
      } catch (error) {
        console.log('WebRTC IP detection failed:', error);
        resolve(null);
      }
    });
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string {
    try {
      // @ts-ignore
      if ('connection' in navigator) {
        // @ts-ignore
        const connection = (navigator as any).connection;
        return connection?.type || 'unknown';
      }
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Start monitoring WiFi connection for automatic check-in
   * Only checks once on login, then stops continuous monitoring
   */
  startWiFiMonitoring(onUncommonNetworkDetected: () => void): () => void {
    let isMonitoring = true;
    let hasCheckedOnLogin = false;

    const checkNetworkOnce = async () => {
      if (!isMonitoring || hasCheckedOnLogin) return;

      try {
        console.log('Performing one-time WiFi check on login...');
        const isUncommon = await this.isConnectedToUncommonWiFi();
        
        if (isUncommon) {
          console.log('Uncommon WiFi network detected on login!');
          onUncommonNetworkDetected();
        } else {
          console.log('Not connected to Uncommon WiFi on login');
        }
        
        hasCheckedOnLogin = true;
        console.log('WiFi check completed. No further automatic checks will be performed.');
      } catch (error) {
        console.error('WiFi login check error:', error);
        hasCheckedOnLogin = true;
      }
    };

    // Check only once immediately on login
    checkNetworkOnce();

    // Return cleanup function (no intervals to clean up)
    return () => {
      isMonitoring = false;
      console.log('WiFi monitoring cleanup completed');
    };
  }
}

export default WiFiService;
