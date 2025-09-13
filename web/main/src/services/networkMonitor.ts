/**
 * Simple Network Monitor
 * Provides network status visibility without blocking operations
 */

import { API_BASE } from "@shared/config";

export interface NetworkStatus {
  localApi: boolean;
  internet: boolean;
  timestamp: number;
  isProduction: boolean;
}

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private lastStatus: NetworkStatus | null = null;
  private readonly isProduction: boolean;

  private constructor() {
    this.isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1' &&
                       !window.location.hostname.includes('localhost');
  }

  public static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  public async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      // Check local API connectivity
      const localApi = await this.checkLocalApi();
      
      // Check internet connectivity (non-blocking)
      const internet = await this.checkInternet();
      
      const status: NetworkStatus = {
        localApi,
        internet,
        timestamp: Date.now(),
        isProduction: this.isProduction
      };
      
      this.lastStatus = status;
      return status;
    } catch (error) {
      console.warn('Network status check failed:', error);
      return {
        localApi: false,
        internet: false,
        timestamp: Date.now(),
        isProduction: this.isProduction
      };
    }
  }

  public getLastStatus(): NetworkStatus | null {
    return this.lastStatus;
  }

  private async checkLocalApi(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkInternet(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const networkMonitor = NetworkMonitor.getInstance();
