# Cal3 Mobile - API Integration Guide

This document describes how the Cal3 Mobile app integrates with the Cal3 NestJS backend API.

---

## Table of Contents

1. [Overview](#overview)
2. [API Client Architecture](#api-client-architecture)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Caching Strategy](#caching-strategy)
7. [Offline Support](#offline-support)
8. [Request/Response Examples](#requestresponse-examples)

---

## Overview

The Cal3 Mobile app communicates with the existing Cal3 NestJS backend via REST API. **No backend changes are required** - the mobile app uses the same API as the web application.

### API Configuration

```typescript
// src/constants/config.ts
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? Platform.OS === 'ios'
      ? 'http://localhost:8081'
      : 'http://10.0.2.2:8081' // Android emulator
    : 'https://your-production-api.com',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};
```

---

## API Client Architecture

### Base API Client

```typescript
// src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../constants/config';
import { SecureStorageService } from '../services/secure-storage';

class ApiClient {
  private client: AxiosInstance;
  private secureStorage = new SecureStorageService();

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.secureStorage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, logout user
          await this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleUnauthorized() {
    await this.secureStorage.removeToken();
    // Navigate to login screen (handled by navigation)
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

---

## Authentication

### Authentication Flow

```
1. User enters credentials
   ↓
2. POST /api/auth/login
   ↓
3. Backend returns { user, token }
   ↓
4. Store token in Keychain (secure)
5. Store user in AsyncStorage
   ↓
6. All subsequent requests include token
```

### Auth API

```typescript
// src/api/auth.ts
import { apiClient } from './client';
import { User } from '../types/User';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: (credentials: LoginDto) =>
    apiClient.post<AuthResponse>('/api/auth/login', credentials),

  register: (data: RegisterDto) =>
    apiClient.post<AuthResponse>('/api/auth/register', data),

  getProfile: () =>
    apiClient.get<User>('/api/user/profile'),

  updateProfile: (data: Partial<User>) =>
    apiClient.patch<User>('/api/user/profile', data),

  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.patch('/api/user/password', { oldPassword, newPassword }),
};
```

---

## API Endpoints

### Calendar Endpoints

```typescript
// src/api/calendars.ts
import { apiClient } from './client';
import { Calendar } from '../types/Calendar';

export interface CreateCalendarDto {
  name: string;
  color?: string;
  description?: string;
}

export const calendarsApi = {
  getCalendars: () =>
    apiClient.get<Calendar[]>('/api/calendars'),

  getCalendar: (id: number) =>
    apiClient.get<Calendar>(`/api/calendars/${id}`),

  createCalendar: (data: CreateCalendarDto) =>
    apiClient.post<Calendar>('/api/calendars', data),

  updateCalendar: (id: number, data: Partial<Calendar>) =>
    apiClient.patch<Calendar>(`/api/calendars/${id}`, data),

  deleteCalendar: (id: number) =>
    apiClient.delete(`/api/calendars/${id}`),
};
```

### Event Endpoints

```typescript
// src/api/events.ts
import { apiClient } from './client';
import { Event } from '../types/Event';

export interface CreateEventDto {
  title: string;
  description?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  isAllDay: boolean;
  calendarId: number;
  color?: string;
  recurrenceRule?: RecurrencePattern;
}

export const eventsApi = {
  getEvents: (calendarId?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (calendarId) params.append('calendarId', calendarId.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return apiClient.get<Event[]>(`/api/events?${params.toString()}`);
  },

  getEvent: (id: number) =>
    apiClient.get<Event>(`/api/events/${id}`),

  createEvent: (data: CreateEventDto) =>
    apiClient.post<Event>('/api/events', data),

  updateEvent: (id: number, data: Partial<CreateEventDto>) =>
    apiClient.patch<Event>(`/api/events/${id}`, data),

  deleteEvent: (id: number, scope?: 'this' | 'future' | 'all') => {
    const params = scope ? `?scope=${scope}` : '';
    return apiClient.delete(`/api/events/${id}${params}`);
  },

  searchEvents: (query: string) =>
    apiClient.get<Event[]>(`/api/events/search?q=${encodeURIComponent(query)}`),
};
```

### Automation Endpoints

```typescript
// src/api/automation.ts
import { apiClient } from './client';
import { AutomationRule, AuditLog } from '../types/Automation';

export const automationApi = {
  getRules: (page = 1, limit = 20) =>
    apiClient.get<{ data: AutomationRule[]; total: number }>(
      `/api/automation/rules?page=${page}&limit=${limit}`
    ),

  getRule: (id: number) =>
    apiClient.get<AutomationRule>(`/api/automation/rules/${id}`),

  createRule: (data: Partial<AutomationRule>) =>
    apiClient.post<AutomationRule>('/api/automation/rules', data),

  updateRule: (id: number, data: Partial<AutomationRule>) =>
    apiClient.put<AutomationRule>(`/api/automation/rules/${id}`, data),

  deleteRule: (id: number) =>
    apiClient.delete(`/api/automation/rules/${id}`),

  executeRule: (id: number) =>
    apiClient.post(`/api/automation/rules/${id}/execute`),

  getAuditLogs: (ruleId: number, page = 1, limit = 20) =>
    apiClient.get<{ data: AuditLog[]; total: number }>(
      `/api/automation/rules/${ruleId}/audit-logs?page=${page}&limit=${limit}`
    ),

  getStats: (ruleId: number) =>
    apiClient.get(`/api/automation/rules/${ruleId}/stats`),
};
```

### Reservation Endpoints

```typescript
// src/api/reservations.ts
import { apiClient } from './client';
import { Reservation, Resource, Organization } from '../types/Reservation';

export const reservationsApi = {
  getOrganizations: () =>
    apiClient.get<Organization[]>('/api/organisations'),

  getResources: (organizationId: number) =>
    apiClient.get<Resource[]>(`/api/resources?organisationId=${organizationId}`),

  getReservations: (resourceId?: number) => {
    const params = resourceId ? `?resourceId=${resourceId}` : '';
    return apiClient.get<Reservation[]>(`/api/reservations${params}`);
  },

  createReservation: (data: Partial<Reservation>) =>
    apiClient.post<Reservation>('/api/reservations', data),

  updateReservation: (id: number, data: Partial<Reservation>) =>
    apiClient.patch<Reservation>(`/api/reservations/${id}`, data),

  cancelReservation: (id: number) =>
    apiClient.patch<Reservation>(`/api/reservations/${id}`, { status: 'cancelled' }),
};
```

### Feature Flags Endpoint

```typescript
// src/api/feature-flags.ts
import { apiClient } from './client';

export interface FeatureFlags {
  oauth: boolean;
  calendarSync: boolean;
  reservations: boolean;
  automation: boolean;
}

export const featureFlagsApi = {
  getFlags: () =>
    apiClient.get<FeatureFlags>('/api/feature-flags'),
};
```

---

## Error Handling

### Error Types

```typescript
// src/types/ApiError.ts
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Error Handling Utility

```typescript
// src/utils/error-handler.ts
import { AxiosError } from 'axios';
import { ApiError, NetworkError, AuthenticationError, ValidationError } from '../types/ApiError';

export const handleApiError = (error: unknown): Error => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;

    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      return new NetworkError('Network connection failed. Please check your internet connection.');
    }

    switch (error.response?.status) {
      case 401:
        return new AuthenticationError('Authentication failed. Please log in again.');
      case 403:
        return new Error('You do not have permission to perform this action.');
      case 404:
        return new Error('The requested resource was not found.');
      case 422:
        return new ValidationError(
          apiError?.message || 'Validation failed',
          apiError?.details
        );
      case 500:
        return new Error('Server error. Please try again later.');
      default:
        return new Error(apiError?.message || 'An unexpected error occurred.');
    }
  }

  return error instanceof Error ? error : new Error('An unknown error occurred.');
};
```

### Usage in Components

```typescript
import { handleApiError } from '../utils/error-handler';

const createEvent = async (eventData: CreateEventDto) => {
  try {
    const event = await eventsApi.createEvent(eventData);
    Alert.alert('Success', 'Event created successfully');
    return event;
  } catch (error) {
    const handledError = handleApiError(error);
    Alert.alert('Error', handledError.message);
    throw handledError;
  }
};
```

---

## Caching Strategy

### React Query Configuration

```typescript
// src/config/react-query.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Custom Hooks with Caching

```typescript
// src/hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../api/events';

export const useEvents = (calendarId?: number) => {
  return useQuery({
    queryKey: ['events', calendarId],
    queryFn: () => eventsApi.getEvents(calendarId),
    enabled: !!calendarId, // Only fetch if calendarId is provided
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.createEvent,
    onMutate: async (newEvent) => {
      // Optimistic update
      await queryClient.cancelQueries(['events', newEvent.calendarId]);

      const previousEvents = queryClient.getQueryData(['events', newEvent.calendarId]);

      queryClient.setQueryData(['events', newEvent.calendarId], (old: Event[]) => [
        ...old,
        { ...newEvent, id: Date.now() }, // Temporary ID
      ]);

      return { previousEvents };
    },
    onError: (err, newEvent, context) => {
      // Rollback on error
      queryClient.setQueryData(['events', newEvent.calendarId], context?.previousEvents);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['events', variables.calendarId]);
    },
  });
};
```

---

## Offline Support

### Sync Queue Implementation

```typescript
// src/services/offline-sync.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: 'events' | 'calendars' | 'reservations';
  data: any;
  timestamp: number;
}

class OfflineSyncService {
  private queue: SyncOperation[] = [];
  private processing = false;

  async initialize() {
    // Load queue from storage
    const stored = await AsyncStorage.getItem('syncQueue');
    this.queue = stored ? JSON.parse(stored) : [];

    // Listen for network changes
    NetInfo.addEventListener((state) => {
      if (state.isConnected && this.queue.length > 0) {
        this.processSyncQueue();
      }
    });
  }

  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp'>) {
    const syncOp: SyncOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    this.queue.push(syncOp);
    await this.saveQueue();

    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const operation = this.queue[0];

      try {
        await this.executeOperation(operation);
        this.queue.shift(); // Remove from queue
        await this.saveQueue();
      } catch (error) {
        console.error('Sync failed:', error);
        this.processing = false;
        return; // Stop processing on error
      }
    }

    this.processing = false;
  }

  private async executeOperation(operation: SyncOperation) {
    switch (operation.resource) {
      case 'events':
        return this.syncEvent(operation);
      case 'calendars':
        return this.syncCalendar(operation);
      case 'reservations':
        return this.syncReservation(operation);
    }
  }

  private async syncEvent(operation: SyncOperation) {
    const { type, data } = operation;

    switch (type) {
      case 'CREATE':
        return eventsApi.createEvent(data);
      case 'UPDATE':
        return eventsApi.updateEvent(data.id, data);
      case 'DELETE':
        return eventsApi.deleteEvent(data.id);
    }
  }

  private async saveQueue() {
    await AsyncStorage.setItem('syncQueue', JSON.stringify(this.queue));
  }

  getQueueLength() {
    return this.queue.length;
  }
}

export const offlineSyncService = new OfflineSyncService();
```

---

## Request/Response Examples

### Login Request/Response

**Request**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "enterenter"
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "themeColor": "blue",
    "timezone": "America/New_York",
    "timeFormat": "12h",
    "usagePlans": ["User", "Enterprise"],
    "isAdmin": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Events Request/Response

**Request**:
```http
GET /api/events?calendarId=1&startDate=2025-10-01&endDate=2025-10-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "description": "Weekly sync",
    "startDate": "2025-10-21",
    "startTime": "14:00",
    "endDate": "2025-10-21",
    "endTime": "15:00",
    "isAllDay": false,
    "color": "#3b82f6",
    "calendarId": 1,
    "createdById": 1,
    "recurrenceRule": {
      "type": "weekly",
      "interval": 1,
      "daysOfWeek": ["monday"]
    }
  }
]
```

### Create Event Request/Response

**Request**:
```http
POST /api/events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Lunch with Client",
  "startDate": "2025-10-22",
  "startTime": "12:00",
  "endDate": "2025-10-22",
  "endTime": "13:00",
  "isAllDay": false,
  "calendarId": 1
}
```

**Response**:
```json
{
  "id": 42,
  "title": "Lunch with Client",
  "startDate": "2025-10-22",
  "startTime": "12:00",
  "endDate": "2025-10-22",
  "endTime": "13:00",
  "isAllDay": false,
  "color": null,
  "calendarId": 1,
  "createdById": 1,
  "createdAt": "2025-10-21T10:30:00Z",
  "updatedAt": "2025-10-21T10:30:00Z"
}
```

---

## Summary

The Cal3 Mobile app integrates seamlessly with the existing backend API:

- **No Backend Changes**: Uses existing REST endpoints
- **Type Safety**: TypeScript types for all API calls
- **Error Handling**: Comprehensive error handling and user feedback
- **Caching**: Smart caching with React Query
- **Offline Support**: Sync queue for offline operations
- **Security**: JWT authentication with secure storage

For backend API documentation, see [../../API_DOCUMENTATION.md](../../API_DOCUMENTATION.md).
