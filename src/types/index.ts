// Event Management System Types

export interface User {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Date;
  photoUrl?: string;
  bio?: string;
  userType: 'organizer' | 'attendee' | 'admin';
}

export interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  description: string;
  createdAt: Date;
  organizer: User;
  organizerId: string;
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
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
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
}

export interface EventContextType {
  events: Event[];
  loading: boolean;
  createEvent: (eventData: Omit<Event, 'id' | 'createdAt' | 'organizer'>) => Promise<string>;
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
