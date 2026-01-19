import React, { createContext, useContext, useState, useEffect } from 'react';
import { Event, EventContextType, User } from '../types';
import { EventService } from '../services/eventService';

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

interface EventProviderProps {
  children: React.ReactNode;
  user?: User | null;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children, user }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const eventService = EventService.getInstance();

  const loadPublicEvents = async () => {
    try {
      setLoading(true);
      const publicEvents = await eventService.getPublicEvents();
      setEvents(publicEvents);
    } catch (error) {
      console.error('Error loading public events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load public events on mount
  useEffect(() => {
    // Intentionally run only once on mount; loadPublicEvents handles its own dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadPublicEvents();
  }, []);

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'organizer'>): Promise<string> => {
    if (!user) throw new Error('User must be logged in to create events');
    
    try {
      setLoading(true);
      const eventId = await eventService.createEvent({
        ...eventData,
        organizerId: user.uid,
      });
      
      // Reload events to include the new one
      if (user.userType === 'organizer' || user.userType === 'admin') {
        await loadUserEvents();
      } else {
        await loadPublicEvents();
      }
      
      return eventId;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<void> => {
    try {
      setLoading(true);
      await eventService.updateEvent(eventId, eventData);
      
      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId ? { ...event, ...eventData } : event
        )
      );
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      setLoading(true);
      await eventService.deleteEvent(eventId);
      
      // Remove from local state
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getEvent = async (eventId: string): Promise<Event | null> => {
    try {
      return await eventService.getEvent(eventId);
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  };

  const getUserEvents = async (userId?: string): Promise<Event[]> => {
    try {
      const targetUserId = userId || user?.uid;
      if (!targetUserId) throw new Error('User ID required');
      
      const userEvents = await eventService.getUserEvents(targetUserId);
      setEvents(userEvents);
      return userEvents;
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  };

  const loadUserEvents = async () => {
    if (user && (user.userType === 'organizer' || user.userType === 'admin')) {
      await getUserEvents();
    }
  };

  const getPublicEvents = async (): Promise<Event[]> => {
    try {
      const publicEvents = await eventService.getPublicEvents();
      setEvents(publicEvents);
      return publicEvents;
    } catch (error) {
      console.error('Error getting public events:', error);
      throw error;
    }
  };

  const value: EventContextType = {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    getUserEvents,
    getPublicEvents,
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};
