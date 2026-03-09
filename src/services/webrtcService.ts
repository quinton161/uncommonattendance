import SimplePeer, { Instance as SimplePeerInstance } from 'simple-peer';
import { callService } from './callService';
import { SignalingMessage } from '../types';

type StreamCallback = (stream: MediaStream | null) => void;
type CallStateCallback = (state: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended') => void;

class WebRTCService {
  private static instance: WebRTCService;
  private peer: SimplePeerInstance | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private remotePeerId: string | null = null;
  private callType: 'voice' | 'video' = 'voice';
  private isInitiator: boolean = false;
  
  // Callbacks
  private onLocalStream: StreamCallback | null = null;
  private onRemoteStream: StreamCallback | null = null;
  private onCallStateChange: CallStateCallback | null = null;

  public static getInstance(): WebRTCService {
    if (!WebRTCService.instance) {
      WebRTCService.instance = new WebRTCService();
    }
    return WebRTCService.instance;
  }

  /**
   * Set callbacks for stream and call state updates
   */
  setCallbacks(
    onLocalStream: StreamCallback | null,
    onRemoteStream: StreamCallback | null,
    onCallStateChange: CallStateCallback | null
  ) {
    this.onLocalStream = onLocalStream;
    this.onRemoteStream = onRemoteStream;
    this.onCallStateChange = onCallStateChange;
  }

  setRemotePeerId(peerId: string): void {
    this.remotePeerId = peerId;
  }

  /**
   * Start a call (initiator)
   */
  async startCall(callId: string, peerId: string, callType: 'voice' | 'video'): Promise<void> {
    this.currentCallId = callId;
    this.remotePeerId = peerId;
    this.callType = callType;
    this.isInitiator = true;

    if (this.onCallStateChange) {
      this.onCallStateChange('calling');
    }

    try {
      // Get local media stream
      this.localStream = await this.getMediaStream(callType);
      
      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      // Create peer connection
      this.createPeer(true);
    } catch (error) {
      console.error('Failed to start call:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(callId: string, callType: 'voice' | 'video'): Promise<void> {
    this.currentCallId = callId;
    // remotePeerId should be set by caller before answering
    this.callType = callType;
    this.isInitiator = false;

    if (this.onCallStateChange) {
      this.onCallStateChange('ringing');
    }

    try {
      // Get local media stream
      this.localStream = await this.getMediaStream(callType);
      
      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      // Create peer connection (not initiator, will wait for signal)
      this.createPeer(false);
    } catch (error) {
      console.error('Failed to answer call:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * End current call
   */
  endCall(): void {
    if (this.currentCallId) {
      callService.endCall(this.currentCallId);
    }
    this.cleanup();
  }

  /**
   * Toggle microphone mute
   */
  toggleMute(mute: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !mute;
      });
    }
  }

  /**
   * Toggle video
   */
  toggleVideo(enable: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enable;
      });
    }
  }

  /**
   * Get local media stream
   */
  private async getMediaStream(callType: 'voice' | 'video'): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: callType === 'video' ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } : false
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  /**
   * Create peer connection
   */
  private createPeer(initiator: boolean): void {
    if (!this.localStream) {
      console.error('No local stream available');
      return;
    }

    this.peer = new SimplePeer({
      initiator,
      stream: this.localStream,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    // Handle peer events
    this.peer.on('signal', (data: any) => {
      console.log('📡 Peer signaling:', data.type);
      
      // Send signal to remote peer via Firestore
      if (this.currentCallId && this.remotePeerId) {
        const receiverId = this.remotePeerId;
        if (data.type === 'offer') {
          callService.sendOffer(this.currentCallId, receiverId, JSON.stringify(data));
        } else if (data.type === 'answer') {
          callService.sendAnswer(this.currentCallId, receiverId, JSON.stringify(data));
        } else if (data.type === 'candidate') {
          callService.sendIceCandidate(this.currentCallId, receiverId, data.candidate as RTCIceCandidateInit);
        }
      } else {
        console.warn('📡 Missing callId or remotePeerId, cannot send signaling');
      }
    });

    this.peer.on('stream', (stream: MediaStream) => {
      console.log('📡 Received remote stream');
      this.remoteStream = stream;
      
      if (this.onRemoteStream) {
        this.onRemoteStream(stream);
      }
      
      if (this.onCallStateChange) {
        this.onCallStateChange('connected');
      }
    });

    this.peer.on('connect', () => {
      console.log('📡 Peer connected');
      if (this.onCallStateChange) {
        this.onCallStateChange('connected');
      }
    });

    this.peer.on('close', () => {
      console.log('📡 Peer closed');
      this.cleanup();
    });

    this.peer.on('error', (err: any) => {
      console.error('📡 Peer error:', err);
      this.cleanup();
    });
  }

  /**
   * Handle incoming signaling message
   */
  handleSignalingMessage(message: SignalingMessage): void {
    if (!this.peer || message.callId !== this.currentCallId) {
      console.log('Ignoring signaling message for different call');
      return;
    }

    if (message.data?.sdp) {
      const sdp = JSON.parse(message.data.sdp);
      if (message.type === 'offer') {
        console.log('📡 Received offer, signaling peer');
        this.peer.signal(sdp);
      } else if (message.type === 'answer') {
        console.log('📡 Received answer, signaling peer');
        this.peer.signal(sdp);
      }
    } else if (message.data?.candidate && message.type === 'ice-candidate') {
      console.log('📡 Received ICE candidate');
      this.peer.signal({
        candidate: message.data.candidate
      } as any);
    }
  }

  /**
   * Check if currently in a call
   */
  isInCall(): boolean {
    return this.peer !== null;
  }

  /**
   * Get current call type
   */
  getCallType(): 'voice' | 'video' {
    return this.callType;
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Cleanup peer connection
   */
  private cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.currentCallId = null;
    this.remotePeerId = null;

    if (this.onLocalStream) {
      this.onLocalStream(null);
    }

    if (this.onRemoteStream) {
      this.onRemoteStream(null);
    }

    if (this.onCallStateChange) {
      this.onCallStateChange('ended');
    }
  }
}

export const webrtcService = WebRTCService.getInstance();
