/**
 * Network Connectivity Validator
 * Ensures admin operations require proper network connectivity
 */

export class NetworkValidator {
  private static instance: NetworkValidator;
  private isOnline: boolean = navigator.onLine;
  private networkCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupNetworkListeners();
    this.startNetworkMonitoring();
  }

  public static getInstance(): NetworkValidator {
    if (!NetworkValidator.instance) {
      NetworkValidator.instance = new NetworkValidator();
    }
    return NetworkValidator.instance;
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network connectivity restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network connectivity lost');
    });
  }

  private startNetworkMonitoring(): void {
    // Check network connectivity every 30 seconds
    this.networkCheckInterval = setInterval(async () => {
      await this.performNetworkTest();
    }, 30000);
  }

  private async performNetworkTest(): Promise<void> {
    try {
      // Test actual network connectivity, not just localhost
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        timeout: 5000
      });
      this.isOnline = true;
    } catch (error) {
      this.isOnline = false;
      console.warn('Network connectivity test failed:', error);
    }
  }

  public isNetworkAvailable(): boolean {
    return this.isOnline && navigator.onLine;
  }

  public async validateNetworkForAdmin(): Promise<boolean> {
    // For admin operations, we need both local connectivity AND internet access
    const hasLocalConnectivity = await this.testLocalConnectivity();
    const hasInternetAccess = await this.testInternetAccess();
    
    return hasLocalConnectivity && hasInternetAccess;
  }

  private async testLocalConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache',
        timeout: 3000
      });
      return response.ok;
    } catch (error) {
      console.warn('Local connectivity test failed:', error);
      return false;
    }
  }

  private async testInternetAccess(): Promise<boolean> {
    try {
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        timeout: 5000
      });
      return true;
    } catch (error) {
      console.warn('Internet connectivity test failed:', error);
      return false;
    }
  }

  public cleanup(): void {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
  }
}

export const networkValidator = NetworkValidator.getInstance();
