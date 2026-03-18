// Event Management System Types

export interface User {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Date;
  photoUrl?: string;
  bio?: string;
  userType: 'instructor' | 'attendee' | 'admin';
}

export interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  description: string;
  createdAt: Date;
  instructor: User;
  instructorId: string;
  capacity?: number;
  imageUrl?: string;
  isPublic: boolean;
  eventStatus: 'draft' | 'published' | 'cancelled' | 'completed';
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  createdAt: Date;
  event: Event;
  eventId: string;
  description?: string;
  accessLevel: 'general' | 'vip' | 'premium';
}

export interface Registration {
  id: string;
  registrationDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  createdAt: Date;
  user: User;
  userId: string;
  event: Event;
  eventId: string;
  ticketType: TicketType;
  ticketTypeId: string;
  notes?: string;
}

export interface EventResource {
  id: string;
  title: string;
  resourceType: 'document' | 'video' | 'audio' | 'image' | 'link';
  url: string;
  createdAt: Date;
  event: Event;
  eventId: string;
  description?: string;
  accessLevel: 'public' | 'registered' | 'premium';
}

export interface Feedback {
  id: string;
  rating: number; // 1-5 stars
  createdAt: Date;
  user: User;
  userId: string;
  event: Event;
  eventId: string;
  comment?: string;
}

// Legacy types for attendance system (still used by some components)
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'completed';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  checkInTime: Date;
  checkOutTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  date: string; // YYYY-MM-DD format
  isPresent: boolean;
  status?: AttendanceStatus;
}

export interface LocationData {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: number;
  ip?: string;
  address?: string;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, userType: User['userType']) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

export interface EventContextType {
  events: Event[];
  loading: boolean;
  createEvent: (eventData: Omit<Event, 'id' | 'createdAt' | 'instructor'>) => Promise<string>;
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEvent: (eventId: string) => Promise<Event | null>;
  getUserEvents: (userId: string) => Promise<Event[]>;
  getPublicEvents: () => Promise<Event[]>;
}

export interface RegistrationContextType {
  registrations: Registration[];
  loading: boolean;
  registerForEvent: (eventId: string, ticketTypeId: string, notes?: string) => Promise<string>;
  cancelRegistration: (registrationId: string) => Promise<void>;
  getUserRegistrations: (userId: string) => Promise<Registration[]>;
  getEventRegistrations: (eventId: string) => Promise<Registration[]>;
}

// ==================== Calling System Types ====================

export type CallType = 'voice' | 'video';
export type CallStatus = 'ringing' | 'active' | 'ended' | 'declined' | 'missed';

export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  type: CallType;
  status: CallStatus;
  startedAt: any;
  endedAt?: any;
  duration?: number; // in seconds
}

export interface SignalingMessage {
  id: string;
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-response' | 'call-ended';
  callId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  data?: {
    sdp?: string; // for offer/answer
    candidate?: RTCIceCandidateInit; // for ICE
    callType?: CallType;
    response?: 'accept' | 'decline';
  };
  timestamp: any;
}

export interface UserPresence {
  userId: string;
  displayName: string;
  isOnline: boolean;
  lastSeen: any;
  lastActive: any;
}

export interface MessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
  updatedAt: any;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: any;
}
