import { CalendarEvent, EventFormData } from '../types/calendar';
import { fetchData } from './api';

export const calendarService = {
  // Get all events for the current user, optionally filtered by date range.
  // studentId is accepted for call-site compatibility but ignored — the backend
  // filters by the authenticated user from the JWT token.
  getEvents: async (startDate?: Date, endDate?: Date, _studentId?: string): Promise<CalendarEvent[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate.toISOString());
    if (endDate) params.append('end', endDate.toISOString());
    const queryString = params.toString();
    return fetchData<CalendarEvent[]>(queryString ? `/calendar/events?${queryString}` : '/calendar/events');
  },

  // Get events for a specific course
  getCourseEvents: async (courseId: string): Promise<CalendarEvent[]> => {
    return fetchData<CalendarEvent[]>(`/calendar/events/course/${courseId}`);
  },

  /**
   * Get calendar events filtered to a specific subject (course).
   * Used by the home panel to show subject-specific upcoming deadlines.
   * studentId is accepted for call-site compatibility but the backend
   * filters by the authenticated user from the JWT token.
   */
  getSubjectEvents: async (subjectId: string, _studentId?: string): Promise<CalendarEvent[]> => {
    return fetchData<CalendarEvent[]>(`/calendar/events/course/${subjectId}`);
  },

  // Get upcoming events. studentId accepted for compatibility, ignored server-side.
  getUpcomingEvents: async (limit = 10, _studentId?: string): Promise<CalendarEvent[]> => {
    return fetchData<CalendarEvent[]>(`/calendar/events/upcoming?limit=${limit}`);
  },

  // Create a new event
  createEvent: async (eventData: Omit<EventFormData, 'id'>): Promise<CalendarEvent> => {
    return fetchData<CalendarEvent>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  // Update an existing event
  updateEvent: async (id: string, eventData: Partial<EventFormData>): Promise<CalendarEvent> => {
    return fetchData<CalendarEvent>(`/calendar/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  // Delete an event
  deleteEvent: async (id: string): Promise<{ message: string }> => {
    return fetchData<{ message: string }>(`/calendar/events/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk create events (for importing schedules)
  bulkCreateEvents: async (events: Omit<EventFormData, 'id'>[]): Promise<CalendarEvent[]> => {
    return fetchData<CalendarEvent[]>('/calendar/events/bulk', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  },
};