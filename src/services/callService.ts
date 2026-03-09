import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { CallSession, CallType, SignalingMessage } from '../types';

type CallEventCallback = (call: CallSession | null) => void;
type SignalingCallback = (message: SignalingMessage) => void;

class CallService {
  private static instance: CallService;
  private currentUserId: string = '';
  private currentUserName: string = '';
  private callUnsubscribe: (() => void) | null = null;
  private signalingUnsubscribe: (() => void) | null = null;
  private activeCallId: string | null = null;
  
  // Callbacks for UI updates
  private onIncomingCall: CallEventCallback | null = null;
  private onCallEnded: CallEventCallback | null = null;
  private onSignalingMessage: SignalingCallback | null = null;

  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  /**
   * Initialize the call service with current user info
   */
  initialize(userId: string, userName: string) {
    this.currentUserId = userId;
    this.currentUserName = userName;
    console.log('📞 CallService initialized for:', userName, '(' + userId + ')');
    
    // Start listening for incoming calls
    this.listenForIncomingCalls();
    this.listenForSignaling();
  }

  /**
   * Set callbacks for call events
   */
  setCallCallbacks(
    onIncoming: CallEventCallback | null,
    onEnded: CallEventCallback | null,
    onSignaling: SignalingCallback | null
  ) {
    this.onIncomingCall = onIncoming;
    this.onCallEnded = onEnded;
    this.onSignalingMessage = onSignaling;
  }

  /**
   * Initiate a call to another user
   */
  async initiateCall(
    calleeId: string,
    calleeName: string,
    callType: CallType
  ): Promise<CallSession> {
    if (!this.currentUserId) {
      throw new Error('CallService not initialized. Call initialize() first.');
    }

    const callId = `${this.currentUserId}_${calleeId}_${Date.now()}`;
    
    const callSession: CallSession = {
      id: callId,
      callerId: this.currentUserId,
      callerName: this.currentUserName,
      calleeId,
      calleeName,
      type: callType,
      status: 'ringing',
      startedAt: serverTimestamp()
    };

    // Save call to Firestore
    await setDoc(doc(db, 'calls', callId), callSession);
    
    // Send signaling message to initiate call
    const signalingMessage: Omit<SignalingMessage, 'id' | 'timestamp'> = {
      type: 'call-request',
      callId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      receiverId: calleeId,
      data: {
        callType
      }
    };

    await this.sendSignalingMessage(signalingMessage);
    
    this.activeCallId = callId;
    console.log('📞 Initiated', callType, 'call to', calleeName, '- callId:', callId);
    
    return callSession;
  }

  /**
   * Accept an incoming call
   */
  async acceptCall(callId: string): Promise<void> {
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, {
      status: 'active'
    });

    // Send acceptance signaling
    await this.sendSignalingMessage({
      type: 'call-response',
      callId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      receiverId: '', // Will be filled by looking up the call
      data: {
        response: 'accept'
      }
    });

    this.activeCallId = callId;
    console.log('📞 Accepted call:', callId);
  }

  /**
   * Decline an incoming call
   */
  async declineCall(callId: string): Promise<void> {
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, {
      status: 'declined',
      endedAt: serverTimestamp()
    });

    // Send decline signaling
    await this.sendSignalingMessage({
      type: 'call-response',
      callId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      receiverId: '',
      data: {
        response: 'decline'
      }
    });

    console.log('📞 Declined call:', callId);
  }

  /**
   * End the current call
   */
  async endCall(callId: string): Promise<void> {
    if (!this.activeCallId && !callId) return;

    const activeCallId = callId || this.activeCallId;
    if (!activeCallId) return;

    const callRef = doc(db, 'calls', activeCallId);
    
    try {
      await updateDoc(callRef, {
        status: 'ended',
        endedAt: serverTimestamp()
      });
    } catch (e) {
      console.log('Call already ended or not found');
    }

    // Send end signaling
    await this.sendSignalingMessage({
      type: 'call-ended',
      callId: activeCallId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      receiverId: ''
    });

    this.activeCallId = null;
    console.log('📞 Ended call:', activeCallId);
  }

  /**
   * Send WebRTC signaling message
   */
  async sendSignalingMessage(message: Omit<SignalingMessage, 'id' | 'timestamp'>): Promise<void> {
    await addDoc(collection(db, 'signaling'), {
      ...message,
      timestamp: serverTimestamp()
    });
  }

  /**
   * Send WebRTC offer
   */
  async sendOffer(callId: string, receiverId: string, sdp: string): Promise<void> {
    await this.sendSignalingMessage({
      type: 'offer',
      callId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      receiverId,
      data: { sdp }
    });
  }

  /**
   * Send WebRTC answer
   */
  async sendAnswer(callId: string, receiverId: string, sdp: string): Promise<void> {
    await this.sendSignalingMessage({
      type: 'answer',
      callId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      receiverId,
      data: { sdp }
    });
  }

  /**
   * Send ICE candidate
   */
  async sendIceCandidate(callId: string, receiverId: string, candidate: RTCIceCandidateInit): Promise<void> {
    await this.sendSignalingMessage({
      type: 'ice-candidate',
      callId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      receiverId,
      data: { candidate }
    });
  }

  /**
   * Listen for incoming calls
   */
  private listenForIncomingCalls(): void {
    if (!this.currentUserId || this.callUnsubscribe) return;

    const q = query(
      collection(db, 'calls'),
      where('calleeId', '==', this.currentUserId),
      where('status', '==', 'ringing'),
      orderBy('startedAt', 'desc')
    );

    this.callUnsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const callData = change.doc.data() as CallSession;
          console.log('📞 Incoming call from:', callData.callerName);
          
          if (this.onIncomingCall) {
            this.onIncomingCall({
              ...callData
            });
          }
        }
      });
    });
  }

  /**
   * Listen for signaling messages
   */
  private listenForSignaling(): void {
    if (!this.currentUserId || this.signalingUnsubscribe) return;

    // Listen for messages where current user is the receiver
    const q = query(
      collection(db, 'signaling'),
      where('receiverId', '==', this.currentUserId),
      orderBy('timestamp', 'asc')
    );

    this.signalingUnsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const message = change.doc.data() as SignalingMessage;
          
          // Handle call-ended globally
          if (message.type === 'call-ended') {
            if (this.onCallEnded) {
              this.onCallEnded(null);
            }
            this.activeCallId = null;
          }

          // Pass to signaling callback for WebRTC handling
          if (this.onSignalingMessage) {
            this.onSignalingMessage({
              ...message
            });
          }
        }
      });
    });
  }

  /**
   * Get call history for current user
   */
  getCallHistory(callback: (calls: CallSession[]) => void): () => void {
    const q = query(
      collection(db, 'calls'),
      where('callerId', '==', this.currentUserId),
      orderBy('startedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(doc => {
        const data = doc.data() as CallSession;
        return {
          ...data
        };
      });
      callback(calls);
    });
  }

  /**
   * Check if there's an active call
   */
  isInCall(): boolean {
    return this.activeCallId !== null;
  }

  /**
   * Get current active call ID
   */
  getActiveCallId(): string | null {
    return this.activeCallId;
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.callUnsubscribe) {
      this.callUnsubscribe();
      this.callUnsubscribe = null;
    }
    if (this.signalingUnsubscribe) {
      this.signalingUnsubscribe();
      this.signalingUnsubscribe = null;
    }
    this.activeCallId = null;
    console.log('📞 CallService cleaned up');
  }
}

export const callService = CallService.getInstance();
