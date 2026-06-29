import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Event, EventContextType, User } from '../types';

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
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  // Fallbacks using any because the generated types might not be ready
  const publicEventsQuery = api?.events?.getPublicEvents;
  const userEventsQuery = api?.events?.getUserEvents;
  
  const publicEvents = useQuery(publicEventsQuery as any) as Event[] | undefined;
  // If we are an instructor, we might want to query their events
  const instructorEvents = useQuery(userEventsQuery as any, user?.uid ? { instructorId: user.uid } : "skip") as Event[] | undefined;

  const createEventMut = useMutation(api?.events?.createEvent as any);
  const updateEventMut = useMutation(api?.events?.updateEvent as any);
  const deleteEventMut = useMutation(api?.events?.deleteEvent as any);

  // Update local state based on reactive queries
  useEffect(() => {
    if (user && (user.userType === 'instructor' || user.userType === 'admin')) {
      if (instructorEvents) setLocalEvents(instructorEvents);
    } else {
      if (publicEvents) setLocalEvents(publicEvents);
    }
  }, [publicEvents, instructorEvents, user]);

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'instructor'>): Promise<string> => {
    if (!user) throw new Error('User must be logged in to create events');
    try {
      setLoading(true);
      const id = await createEventMut({
        ...eventData,
        instructorId: user.uid,
        startDate: eventData.startDate.toISOString(),
        endDate: eventData.endDate.toISOString(),
      });
      return id;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<void> => {
    try {
      setLoading(true);
      const updates = { ...eventData } as any;
      if (updates.startDate) updates.startDate = updates.startDate.toISOString();
      if (updates.endDate) updates.endDate = updates.endDate.toISOString();
      await updateEventMut({ eventId, updates });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      setLoading(true);
      await deleteEventMut({ eventId });
    } finally {
      setLoading(false);
    }
  };

  const getEvent = async (eventId: string): Promise<Event | null> => {
    // Convex query is reactive, but components might call this as a Promise.
    // Ideally we rewrite the components to useQuery. For now, we return from local state
    // or return null as a stub if not found.
    return localEvents.find(e => e.id === eventId) || null;
  };

  const getUserEvents = async (userId?: string): Promise<Event[]> => {
    return instructorEvents || [];
  };

  const getPublicEvents = async (): Promise<Event[]> => {
    return publicEvents || [];
  };

  const value: EventContextType = {
    events: localEvents,
    loading: loading || (publicEvents === undefined && instructorEvents === undefined),
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

