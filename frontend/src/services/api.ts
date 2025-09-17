import type { Event, CreateEventRequest } from '../types/Event';
import type { Calendar, CreateCalendarRequest, UpdateCalendarRequest } from '../types/Calendar';

const API_BASE_URL = 'http://localhost:8081';

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getAllEvents(): Promise<Event[]> {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to view events.');
      }
      throw new Error('Failed to fetch events');
    }
    const events = await response.json();
    return events; // Return events as-is since they already have the correct format
  }

  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to create events.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create event');
    }

    return await response.json();
  }

  async deleteEvent(eventId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to delete events.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete event');
    }
  }

  // Calendar methods
  async getAllCalendars(): Promise<Calendar[]> {
    const response = await fetch(`${API_BASE_URL}/api/calendars`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to view calendars.');
      }
      throw new Error('Failed to fetch calendars');
    }
    return await response.json();
  }

  async createCalendar(calendarData: CreateCalendarRequest): Promise<Calendar> {
    const response = await fetch(`${API_BASE_URL}/api/calendars`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(calendarData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to create calendars.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create calendar');
    }

    return await response.json();
  }

  async updateCalendar(calendarId: number, calendarData: UpdateCalendarRequest): Promise<Calendar> {
    const response = await fetch(`${API_BASE_URL}/api/calendars/${calendarId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(calendarData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update calendars.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update calendar');
    }

    return await response.json();
  }

  async deleteCalendar(calendarId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/calendars/${calendarId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to delete calendars.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete calendar');
    }
  }

  // Authentication methods
  async login(usernameOrEmail: string, password: string): Promise<{ token: string, user: any }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: usernameOrEmail, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.access_token);
    return { token: data.access_token, user: data.user };
  }

  async register(userData: { username: string, email: string, password: string, firstName?: string, lastName?: string }): Promise<{ token: string, user: any }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.access_token);
    return { token: data.access_token, user: data.user };
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // OAuth methods
  initiateGoogleLogin(): void {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  }

  initiateMicrosoftLogin(): void {
    window.location.href = `${API_BASE_URL}/api/auth/microsoft`;
  }
}

export const apiService = new ApiService();