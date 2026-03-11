import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { UserPresence } from '../types';

type PresenceCallback = (presence: UserPresence | null) => void;
type OnlineUsersCallback = (users: UserPresence[]) => void;

class PresenceService {
  private static instance: PresenceService;
  private currentUserId: string = '';
  private currentUserName: string = '';
  private unsubscribePresence: (() => void) | null = null;
  private unsubscribeAllUsers: (() => void) | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  // Callbacks
  private onPresenceChange: PresenceCallback | null = null;
  private onOnlineUsersChange: OnlineUsersCallback | null = null;

  private static readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private static readonly PRESENCE_TTL = 60000; // 60 seconds - user considered offline after this

  public static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
    }
    return PresenceService.instance;
  }

  /**
   * Initialize presence service for a user
   */
  async initialize(userId: string, userName: string): Promise<void> {
    this.currentUserId = userId;
    this.currentUserName = userName;
    
    console.log('👤 PresenceService initialized for:', userName, '(' + userId + ')');
    
    // Set user as online
    await this.setOnline();
    
    // Start heartbeat to maintain online status
    this.startHeartbeat();
    
    // Listen for own presence changes
    this.listenToOwnPresence();
    
    // Set up offline detection
    this.setupOfflineDetection();
  }

  /**
   * Set current user as online
   */
  async setOnline(): Promise<void> {
    if (!this.currentUserId) return;

    const presenceRef = doc(db, 'presence', this.currentUserId);
    
    await setDoc(presenceRef, {
      userId: this.currentUserId,
      displayName: this.currentUserName,
      isOnline: true,
      lastSeen: serverTimestamp(),
      lastActive: serverTimestamp()
    }, { merge: true });
    
    console.log('👤 Set user as online');
  }

  /**
   * Set current user as offline
   */
  async setOffline(): Promise<void> {
    if (!this.currentUserId) return;

    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    const presenceRef = doc(db, 'presence', this.currentUserId);
    
    await updateDoc(presenceRef, {
      isOnline: false,
      lastSeen: serverTimestamp()
    });
    
    console.log('👤 Set user as offline');
    
    // Clean up listeners
    if (this.unsubscribePresence) {
      this.unsubscribePresence();
      this.unsubscribePresence = null;
    }
  }

  /**
   * Start heartbeat to maintain online status
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      if (this.currentUserId && navigator.onLine) {
        await this.updateActivity();
      }
    }, PresenceService.HEARTBEAT_INTERVAL);
  }

  /**
   * Update user's last active timestamp
   */
  async updateActivity(): Promise<void> {
    if (!this.currentUserId) return;

    const presenceRef = doc(db, 'presence', this.currentUserId);
    
    try {
      await updateDoc(presenceRef, {
        lastActive: serverTimestamp()
      });
    } catch (e) {
      // Document might not exist, create it
      await this.setOnline();
    }
  }

  /**
   * Listen to own presence changes
   */
  private listenToOwnPresence(): void {
    if (!this.currentUserId || this.unsubscribePresence) return;

    const presenceRef = doc(db, 'presence', this.currentUserId);
    
    this.unsubscribePresence = onSnapshot(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserPresence;
        
        if (this.onPresenceChange) {
          this.onPresenceChange(data);
        }
      }
    });
  }

  /**
   * Listen to all online users (useful for admin)
   */
  listenToOnlineUsers(callback: OnlineUsersCallback): () => void {
    // For admin/staff - see all online users
    const q = query(
      collection(db, 'presence'),
      where('isOnline', '==', true),
      orderBy('lastActive', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        userId: doc.id,
        ...doc.data()
      })) as UserPresence[];
      
      callback(users);
    });

    return unsubscribe;
  }

  /**
   * Check if a specific user is online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const presenceRef = doc(db, 'presence', userId);
    const snapshot = await getDoc(presenceRef);
    
    if (!snapshot.exists()) return false;
    
    const data = snapshot.data() as UserPresence;
    
    // Check if the presence data is stale
    const lastActive = data.lastActive?.toDate?.() || new Date(data.lastActive);
    const now = new Date();
    const timeSinceLastActive = now.getTime() - lastActive.getTime();
    
    return data.isOnline && timeSinceLastActive < PresenceService.PRESENCE_TTL;
  }

  /**
   * Get user's presence data
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    const presenceRef = doc(db, 'presence', userId);
    const snapshot = await getDoc(presenceRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      userId: snapshot.id,
      ...snapshot.data()
    } as UserPresence;
  }

  /**
   * Set callback for presence changes
   */
  setPresenceCallback(callback: PresenceCallback | null): void {
    this.onPresenceChange = callback;
  }

  /**
   * Set callback for online users list
   */
  setOnlineUsersCallback(callback: OnlineUsersCallback | null): void {
    this.onOnlineUsersChange = callback;
  }

  /**
   * Listen to a specific user's presence
   */
  subscribeToUserPresence(userId: string, callback: PresenceCallback): () => void {
    const presenceRef = doc(db, 'presence', userId);
    
    return onSnapshot(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.id === userId ? { userId: snapshot.id, ...snapshot.data() } as UserPresence : null);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Set up offline detection
   */
  private setupOfflineDetection(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Back online, updating presence...');
      this.setOnline();
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Gone offline');
      // Don't set offline immediately - could be temporary
    });

    // Also update on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched tabs - just update activity
        console.log('👤 User switched tabs');
      } else {
        // User came back
        console.log('👤 User came back, updating activity...');
        this.updateActivity();
      }
    });
  }

  /**
   * Clean up presence service
   */
  async cleanup(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.unsubscribePresence) {
      this.unsubscribePresence();
      this.unsubscribePresence = null;
    }

    if (this.unsubscribeAllUsers) {
      this.unsubscribeAllUsers();
      this.unsubscribeAllUsers = null;
    }

    // Set as offline before cleanup
    if (this.currentUserId) {
      await this.setOffline();
    }

    console.log('👤 PresenceService cleaned up');
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string {
    return this.currentUserId;
  }
}

export const presenceService = PresenceService.getInstance();
