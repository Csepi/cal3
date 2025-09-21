import type { Event, CreateEventRequest, UpdateEventRequest } from '../types/Event';
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

  async updateEvent(eventId: number, eventData: UpdateEventRequest): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update events.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update event');
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

  // User Profile methods
  async getUserProfile(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to view profile.');
      }
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  }

  async updateUserProfile(profileData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update profile.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }

    return await response.json();
  }

  async updateUserTheme(themeColor: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/user/theme`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ themeColor }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to update theme.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update theme');
    }

    return await response.json();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/user/password`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to change password');
    }

    return await response.json();
  }

  // Calendar Sync methods
  async getCalendarSyncStatus(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/calendar-sync/status`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to view sync status.');
      }
      // Return default status if sync not configured yet
      if (response.status === 404) {
        return {
          providers: [
            { provider: 'google', isConnected: false, calendars: [], syncedCalendars: [] },
            { provider: 'microsoft', isConnected: false, calendars: [], syncedCalendars: [] }
          ]
        };
      }
      throw new Error('Failed to fetch sync status');
    }

    return await response.json();
  }

  async getCalendarAuthUrl(provider: 'google' | 'microsoft'): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/calendar-sync/auth/${provider}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to connect calendar.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get authorization URL');
    }

    const data = await response.json();
    return data.authUrl;
  }

  async syncCalendars(syncData: { provider: string, calendars: Array<{ externalId: string, localName: string }> }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/calendar-sync/sync`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(syncData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to sync calendars.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to sync calendars');
    }

    return await response.json();
  }

  async disconnectCalendarProvider(provider?: 'google' | 'microsoft'): Promise<void> {
    const url = provider
      ? `${API_BASE_URL}/api/calendar-sync/disconnect/${provider}`
      : `${API_BASE_URL}/api/calendar-sync/disconnect`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to disconnect provider.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to disconnect provider');
    }
  }

  async forceCalendarSync(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/calendar-sync/force`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in to force sync.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to force sync');
    }

    return await response.json();
  }
}

export const apiService = new ApiService();