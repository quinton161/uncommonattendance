import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Event, TicketType, Registration, EventResource, Feedback } from '../types';

export class EventService {
  private static instance: EventService;

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  // Event Management
  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'organizer'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        createdAt: Timestamp.now(),
        startDate: Timestamp.fromDate(eventData.startDate),
        endDate: Timestamp.fromDate(eventData.endDate),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<void> {
    try {
      const eventRef = doc(db, 'events', eventId);
      const updateData: any = { ...eventData };
      
      // Convert dates to Timestamps if they exist
      if (eventData.startDate) {
        updateData.startDate = Timestamp.fromDate(eventData.startDate);
      }
      if (eventData.endDate) {
        updateData.endDate = Timestamp.fromDate(eventData.endDate);
      }
      
      await updateDoc(eventRef, updateData);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        return {
          id: eventDoc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
        } as Event;
      }
      return null;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    try {
      const q = query(
        collection(db, 'events'),
        where('organizerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Event[];
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  }

  async getPublicEvents(): Promise<Event[]> {
    try {
      const q = query(
        collection(db, 'events'),
        where('isPublic', '==', true),
        where('eventStatus', '==', 'published'),
        orderBy('startDate', 'asc'),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Event[];
    } catch (error) {
      console.error('Error getting public events:', error);
      throw error;
    }
  }

  // Ticket Type Management
  async createTicketType(ticketData: Omit<TicketType, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'ticketTypes'), {
        ...ticketData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating ticket type:', error);
      throw error;
    }
  }

  async getEventTicketTypes(eventId: string): Promise<TicketType[]> {
    try {
      const q = query(
        collection(db, 'ticketTypes'),
        where('eventId', '==', eventId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as TicketType[];
    } catch (error) {
      console.error('Error getting ticket types:', error);
      throw error;
    }
  }

  // Registration Management
  async registerForEvent(
    userId: string, 
    eventId: string, 
    ticketTypeId: string, 
    notes?: string
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'registrations'), {
        userId,
        eventId,
        ticketTypeId,
        notes: notes || '',
        status: 'pending',
        registrationDate: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }

  async cancelRegistration(registrationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'registrations', registrationId), {
        status: 'cancelled'
      });
    } catch (error) {
      console.error('Error cancelling registration:', error);
      throw error;
    }
  }

  async getUserRegistrations(userId: string): Promise<Registration[]> {
    try {
      const q = query(
        collection(db, 'registrations'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registrationDate: doc.data().registrationDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Registration[];
    } catch (error) {
      console.error('Error getting user registrations:', error);
      throw error;
    }
  }

  async getEventRegistrations(eventId: string): Promise<Registration[]> {
    try {
      const q = query(
        collection(db, 'registrations'),
        where('eventId', '==', eventId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registrationDate: doc.data().registrationDate.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Registration[];
    } catch (error) {
      console.error('Error getting event registrations:', error);
      throw error;
    }
  }

  // Feedback Management
  async submitFeedback(
    userId: string,
    eventId: string,
    rating: number,
    comment?: string
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'feedback'), {
        userId,
        eventId,
        rating,
        comment: comment || '',
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async getEventFeedback(eventId: string): Promise<Feedback[]> {
    try {
      const q = query(
        collection(db, 'feedback'),
        where('eventId', '==', eventId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Feedback[];
    } catch (error) {
      console.error('Error getting event feedback:', error);
      throw error;
    }
  }

  // Event Resources Management
  async addEventResource(resourceData: Omit<EventResource, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'eventResources'), {
        ...resourceData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding event resource:', error);
      throw error;
    }
  }

  async getEventResources(eventId: string): Promise<EventResource[]> {
    try {
      const q = query(
        collection(db, 'eventResources'),
        where('eventId', '==', eventId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as EventResource[];
    } catch (error) {
      console.error('Error getting event resources:', error);
      throw error;
    }
  }
}
