import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { Event, TicketType, Registration, EventResource, Feedback } from '../types';

export class EventService {
  private static instance: EventService;

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'instructor'>): Promise<string> {
    try {
      const id = await convex.mutation(api.events.createEvent as any, {
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate.toISOString(),
        endDate: eventData.endDate?.toISOString(),
        location: eventData.location,
        instructorId: eventData.instructorId,
        capacity: eventData.capacity,
        imageUrl: eventData.imageUrl,
        isPublic: eventData.isPublic,
        eventStatus: eventData.eventStatus,
        hubId: eventData.hubId,
      });
      return id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<void> {
    try {
      const updates: any = { ...eventData };
      if (updates.startDate) updates.startDate = updates.startDate.toISOString();
      if (updates.endDate) updates.endDate = updates.endDate.toISOString();
      delete (updates as any).id;
      await convex.mutation(api.events.updateEvent as any, {
        eventId: eventId as any,
        updates,
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await convex.mutation(api.events.deleteEvent as any, { eventId: eventId as any });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const result = await convex.query(api.events.getEvent as any, { eventId: eventId as any }) as any;
      if (!result) return null;
      return {
        id: result._id || result.id,
        ...result,
        startDate: new Date(result.startDate),
        endDate: result.endDate ? new Date(result.endDate) : undefined,
        createdAt: new Date(result.createdAt),
      } as Event;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    try {
      const results = await convex.query(api.events.getUserEvents as any, { instructorId: userId }) as any[];
      return results.map((r: any) => ({
        id: r._id || r.id,
        ...r,
        startDate: new Date(r.startDate),
        endDate: r.endDate ? new Date(r.endDate) : undefined,
        createdAt: new Date(r.createdAt),
      })) as Event[];
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  }

  async getPublicEvents(): Promise<Event[]> {
    try {
      const results = await convex.query(api.events.getPublicEvents as any) as any[];
      return results.map((r: any) => ({
        id: r._id || r.id,
        ...r,
        startDate: new Date(r.startDate),
        endDate: r.endDate ? new Date(r.endDate) : undefined,
        createdAt: new Date(r.createdAt),
      })) as Event[];
    } catch (error) {
      console.error('Error getting public events:', error);
      throw error;
    }
  }

  async createTicketType(ticketData: Omit<TicketType, 'id' | 'createdAt'>): Promise<string> {
    try {
      return await convex.mutation(api.events.createTicketType as any, {
        eventId: ticketData.eventId as any,
        name: ticketData.name,
        price: ticketData.price,
        quantity: ticketData.capacity,
        description: ticketData.description,
        accessLevel: ticketData.accessLevel,
      });
    } catch (error) {
      console.error('Error creating ticket type:', error);
      throw error;
    }
  }

  async getEventTicketTypes(eventId: string): Promise<TicketType[]> {
    try {
      const results = await convex.query(api.events.getEventTicketTypes as any, { eventId: eventId as any }) as any[];
      return results.map((r: any) => ({
        id: r._id,
        name: r.name,
        price: r.price,
        capacity: r.quantity,
        eventId: r.eventId,
        description: r.description,
        accessLevel: r.accessLevel,
        createdAt: new Date(r._creationTime),
      })) as TicketType[];
    } catch (error) {
      console.error('Error getting ticket types:', error);
      throw error;
    }
  }

  async registerForEvent(userId: string, eventId: string, ticketTypeId: string, notes?: string): Promise<string> {
    try {
      return await convex.mutation(api.events.registerForEvent as any, {
        userId: userId as any,
        eventId: eventId as any,
        ticketTypeId: ticketTypeId as any,
        notes,
      });
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }

  async cancelRegistration(registrationId: string): Promise<void> {
    try {
      await convex.mutation(api.events.cancelRegistration as any, { registrationId: registrationId as any });
    } catch (error) {
      console.error('Error cancelling registration:', error);
      throw error;
    }
  }

  async getUserRegistrations(userId: string): Promise<Registration[]> {
    try {
      const results = await convex.query(api.events.getUserRegistrations as any, { userId: userId as any }) as any[];
      return results.map((r: any) => ({
        id: r._id,
        userId: r.studentId,
        eventId: r.eventId,
        ticketTypeId: r.ticketTypeId,
        status: r.status,
        notes: r.notes,
        registrationDate: new Date(r.createdAt),
        createdAt: new Date(r.createdAt),
      })) as Registration[];
    } catch (error) {
      console.error('Error getting user registrations:', error);
      throw error;
    }
  }

  async getEventRegistrations(eventId: string): Promise<Registration[]> {
    try {
      const results = await convex.query(api.events.getEventRegistrations as any, { eventId: eventId as any }) as any[];
      return results.map((r: any) => ({
        id: r._id,
        userId: r.studentId,
        eventId: r.eventId,
        ticketTypeId: r.ticketTypeId,
        status: r.status,
        notes: r.notes,
        registrationDate: new Date(r.createdAt),
        createdAt: new Date(r.createdAt),
      })) as Registration[];
    } catch (error) {
      console.error('Error getting event registrations:', error);
      throw error;
    }
  }

  async submitFeedback(userId: string, eventId: string, rating: number, comment?: string): Promise<string> {
    try {
      return await convex.mutation(api.events.submitFeedback as any, {
        userId: userId as any,
        eventId: eventId as any,
        rating,
        comment,
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async getEventFeedback(eventId: string): Promise<Feedback[]> {
    try {
      const results = await convex.query(api.events.getEventFeedback as any, { eventId: eventId as any }) as any[];
      return results.map((r: any) => ({
        id: r._id,
        userId: r.studentId,
        eventId: r.eventId,
        rating: r.rating,
        comment: r.comment,
        createdAt: new Date(r.createdAt),
      })) as Feedback[];
    } catch (error) {
      console.error('Error getting event feedback:', error);
      throw error;
    }
  }

  async addEventResource(resourceData: Omit<EventResource, 'id' | 'createdAt'>): Promise<string> {
    try {
      return await convex.mutation(api.events.addEventResource as any, {
        eventId: resourceData.eventId as any,
        title: resourceData.title,
        resourceType: resourceData.resourceType,
        url: resourceData.url,
        description: resourceData.description,
        accessLevel: resourceData.accessLevel,
      });
    } catch (error) {
      console.error('Error adding event resource:', error);
      throw error;
    }
  }

  async getEventResources(eventId: string): Promise<EventResource[]> {
    try {
      const results = await convex.query(api.events.getEventResources as any, { eventId: eventId as any }) as any[];
      return results.map((r: any) => ({
        id: r._id,
        eventId: r.eventId,
        title: r.title,
        resourceType: r.resourceType,
        url: r.url,
        description: r.description,
        accessLevel: r.accessLevel,
        createdAt: new Date(r.createdAt),
      })) as EventResource[];
    } catch (error) {
      console.error('Error getting event resources:', error);
      throw error;
    }
  }
}
