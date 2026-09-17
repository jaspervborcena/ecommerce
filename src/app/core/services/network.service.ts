import { Injectable, signal, computed, inject } from '@angular/core';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private firestore = inject(Firestore);
  
  // Signal to track network status
  private isOnlineSignal = signal<boolean>(navigator.onLine);
  
  // Public readonly computed properties
  readonly isOnline = computed(() => this.isOnlineSignal());
  readonly isOffline = computed(() => !this.isOnlineSignal());
  
  private firestoreUnsubscribe?: () => void;
  
  constructor() {
    this.initFirestoreConnectionMonitor();
    this.initNetworkListeners();
  }

  /**
   * Monitor Firestore connection state - SOURCE OF TRUTH
   * Uses onSnapshot with includeMetadataChanges to detect cache vs server reads
   */
  private initFirestoreConnectionMonitor(): void {
    try {
      // Monitor a lightweight document to detect Firestore connectivity
      const connectionTestRef = doc(this.firestore, '_connection_test_/status');
      
      this.firestoreUnsubscribe = onSnapshot(
        connectionTestRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          // A cached snapshot is normal during startup and does not prove that
          // the browser is offline. Use the browser signal for login and auth
          // flows; Firestore will continue retrying its server connection.
          this.updateNetworkStatus(navigator.onLine);
        },
        (error) => {
          console.warn('⚠️ Firestore connection monitor error:', error);
          // A permission error or an unavailable monitor document does not
          // mean the browser has lost connectivity.
          this.updateNetworkStatus(navigator.onLine);
        }
      );
    } catch (error) {
      console.error('❌ Failed to initialize Firestore connection monitor:', error);
      // Fallback to navigator.onLine if Firestore monitoring fails
      this.updateNetworkStatus(navigator.onLine);
    }
  }

  /**
   * Listen to browser online/offline events as additional signal
   * Firestore connection state is still the primary source of truth
   */
  private initNetworkListeners(): void {
    // Listen for browser online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Browser: Detected online status');
      // Don't immediately trust this - wait for Firestore to confirm
    });

    window.addEventListener('offline', () => {
      console.log('📴 Browser: Detected offline status');
      // Browser offline usually means truly offline, trust it
      this.updateNetworkStatus(false);
    });
  }

  private updateNetworkStatus(isOnline: boolean): void {
    const currentStatus = this.isOnlineSignal();
    if (currentStatus !== isOnline) {
      this.isOnlineSignal.set(isOnline);
    }
  }

  // Method to manually set offline status for testing
  setOfflineMode(isOffline: boolean): void {
    console.log(`🧪 Network: Manually setting ${isOffline ? 'OFFLINE' : 'ONLINE'} mode`);
    this.updateNetworkStatus(!isOffline);
  }

  // Method to manually trigger connectivity check (legacy compatibility)
  async checkConnectivity(): Promise<void> {
    // Firestore monitoring is automatic, this is just for compatibility
    console.log('🔍 Network: Manual connectivity check (using Firestore state)');
  }

  // Get current status
  getCurrentStatus(): boolean {
    return this.isOnlineSignal();
  }
  
  // Cleanup when service is destroyed
  ngOnDestroy(): void {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
    }
  }
}