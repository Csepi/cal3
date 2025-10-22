# Cal3 Mobile - Architecture Documentation

This document provides a comprehensive overview of the Cal3 Mobile application architecture, design patterns, and technical decisions.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Application Layers](#application-layers)
3. [Navigation Architecture](#navigation-architecture)
4. [State Management](#state-management)
5. [Data Flow](#data-flow)
6. [Component Hierarchy](#component-hierarchy)
7. [Offline-First Strategy](#offline-first-strategy)
8. [Security Architecture](#security-architecture)
9. [Performance Optimization](#performance-optimization)
10. [Platform-Specific Considerations](#platform-specific-considerations)

---

## High-Level Architecture

Cal3 Mobile follows a **layered architecture** pattern, separating concerns across distinct layers:

```
┌───────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  Screens   │  │ Components │  │ Navigation │             │
│  └────────────┘  └────────────┘  └────────────┘             │
├───────────────────────────────────────────────────────────────┤
│                   BUSINESS LOGIC LAYER                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Hooks    │  │   State    │  │  Services  │             │
│  └────────────┘  └────────────┘  └────────────┘             │
├───────────────────────────────────────────────────────────────┤
│                       DATA LAYER                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ API Client │  │  Database  │  │  Storage   │             │
│  └────────────┘  └────────────┘  └────────────┘             │
├───────────────────────────────────────────────────────────────┤
│                     PLATFORM LAYER                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │    iOS     │  │  Android   │  │   Native   │             │
│  │  Modules   │  │  Modules   │  │ Libraries  │             │
│  └────────────┘  └────────────┘  └────────────┘             │
└───────────────────────────────────────────────────────────────┘
                              ↓
                     HTTP/REST Protocol
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                    Cal3 BACKEND (NestJS)                      │
│                PostgreSQL @ 192.168.1.101:5433                │
└───────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Unidirectional Data Flow**: Data flows predictably through the app
3. **Offline-First**: Local data is the primary source of truth
4. **Platform Agnostic**: Business logic works on both iOS and Android
5. **Type Safety**: TypeScript ensures compile-time safety
6. **Testability**: Pure functions and dependency injection for easy testing

---

## Application Layers

### 1. Presentation Layer

**Responsibility**: User interface and user interactions

**Components**:
- **Screens**: Full-screen components representing app routes
- **Components**: Reusable UI building blocks
- **Navigation**: Screen transitions and routing logic

**Key Patterns**:
- Container/Presentational component pattern
- Hooks for side effects and state
- Responsive layouts using Flexbox
- Platform-specific rendering when needed

**Example**:
```typescript
// Screen (Container Component)
export const CalendarHomeScreen = () => {
  const { calendars, isLoading } = useCalendars();
  const navigation = useNavigation();

  return (
    <CalendarView
      calendars={calendars}
      isLoading={isLoading}
      onEventPress={(event) => navigation.navigate('EventDetail', { eventId: event.id })}
    />
  );
};

// Component (Presentational)
export const CalendarView: React.FC<Props> = ({ calendars, isLoading, onEventPress }) => {
  if (isLoading) return <LoadingSpinner />;
  return <MonthGrid calendars={calendars} onEventPress={onEventPress} />;
};
```

---

### 2. Business Logic Layer

**Responsibility**: Application logic, state management, business rules

**Components**:
- **Custom Hooks**: Encapsulate reusable logic
- **State Management**: Global and local state
- **Services**: Business logic implementations

**Key Patterns**:
- Custom hooks for data fetching
- Zustand for lightweight global state
- React Query for server state caching
- Service layer for complex business logic

**Example**:
```typescript
// Custom Hook
export const useEvents = (calendarId: number) => {
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['events', calendarId],
    queryFn: () => eventsApi.getEvents(calendarId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createEvent = useMutation({
    mutationFn: eventsApi.createEvent,
    onSuccess: () => refetch(),
  });

  return { events, isLoading, createEvent };
};

// Service
export class NotificationService {
  async scheduleEventReminder(event: Event) {
    const trigger = new Date(event.startDate);
    trigger.setMinutes(trigger.getMinutes() - 15); // 15 min before

    await PushNotification.localNotificationSchedule({
      message: `Event starting soon: ${event.title}`,
      date: trigger,
      userInfo: { eventId: event.id },
    });
  }
}
```

---

### 3. Data Layer

**Responsibility**: Data persistence, API communication, caching

**Components**:
- **API Client**: HTTP communication with backend
- **Local Database**: Offline data storage (WatermelonDB/Realm)
- **Async Storage**: Key-value persistence
- **Secure Storage**: Sensitive data (tokens)

**Key Patterns**:
- Repository pattern for data access
- Optimistic updates for better UX
- Cache-first strategy
- Sync queue for offline operations

**Example**:
```typescript
// API Client
class EventsApiClient {
  async getEvents(calendarId: number): Promise<Event[]> {
    const response = await apiClient.get(`/events?calendarId=${calendarId}`);
    return response.data;
  }

  async createEvent(event: CreateEventDto): Promise<Event> {
    const response = await apiClient.post('/events', event);
    return response.data;
  }
}

// Repository Pattern
class EventRepository {
  async getEvents(calendarId: number): Promise<Event[]> {
    // Try local database first
    const localEvents = await database.collections
      .get<Event>('events')
      .query(Q.where('calendar_id', calendarId))
      .fetch();

    // If online, sync with server
    if (isOnline) {
      const serverEvents = await eventsApi.getEvents(calendarId);
      await this.syncEvents(localEvents, serverEvents);
      return serverEvents;
    }

    return localEvents;
  }
}
```

---

### 4. Platform Layer

**Responsibility**: Native platform features and OS integration

**Components**:
- iOS Native Modules
- Android Native Modules
- Third-party native libraries
- Platform-specific APIs

**Example**:
```typescript
// Platform-specific implementation
import { Platform } from 'react-native';
import BiometricsIOS from 'react-native-biometrics';
import BiometricsAndroid from 'react-native-fingerprint-scanner';

export class BiometricService {
  async authenticate(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const result = await BiometricsIOS.simplePrompt({
        promptMessage: 'Authenticate to access Cal3',
      });
      return result.success;
    } else {
      return new Promise((resolve) => {
        BiometricsAndroid.authenticate({
          description: 'Authenticate to access Cal3',
          onSuccess: () => resolve(true),
          onFailure: () => resolve(false),
        });
      });
    }
  }
}
```

---

## Navigation Architecture

Cal3 Mobile uses **React Navigation** with a nested navigator structure:

```
AppNavigator (Root)
├── AuthNavigator (Stack) [if not authenticated]
│   ├── Login
│   ├── Register
│   └── ForgotPassword
└── MainNavigator (Bottom Tabs) [if authenticated]
    ├── CalendarNavigator (Stack)
    │   ├── CalendarHome (Month/Week/Day/Agenda)
    │   ├── EventDetail
    │   ├── EventCreate
    │   └── EventEdit
    ├── ReservationsNavigator (Stack)
    │   ├── ReservationList
    │   ├── ReservationDetail
    │   └── ReservationCreate
    ├── AutomationNavigator (Stack)
    │   ├── AutomationList
    │   ├── AutomationDetail
    │   └── AutomationCreate
    ├── ProfileNavigator (Stack)
    │   ├── ProfileHome
    │   ├── Settings
    │   ├── ThemeSelector
    │   └── TimezoneSelector
    └── AdminNavigator (Stack) [if admin]
        ├── UserManagement
        ├── SystemInfo
        └── OrganizationManagement
```

### Navigation Implementation

```typescript
// AppNavigator.tsx
export const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

// MainNavigator.tsx (Bottom Tabs)
const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator>
      <Tab.Screen name="Calendar" component={CalendarNavigator} />
      <Tab.Screen name="Reservations" component={ReservationsNavigator} />
      <Tab.Screen name="Automation" component={AutomationNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
      {user.isAdmin && (
        <Tab.Screen name="Admin" component={AdminNavigator} />
      )}
    </Tab.Navigator>
  );
};

// CalendarNavigator.tsx (Stack)
const Stack = createStackNavigator();

export const CalendarNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="CalendarHome" component={CalendarHomeScreen} />
    <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    <Stack.Screen name="EventCreate" component={EventCreateScreen} />
    <Stack.Screen name="EventEdit" component={EventEditScreen} />
  </Stack.Navigator>
);
```

---

## State Management

Cal3 Mobile uses a **hybrid state management** approach:

### 1. Local State (useState, useReducer)

For component-specific state that doesn't need to be shared.

```typescript
const [selectedDate, setSelectedDate] = useState(new Date());
const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
```

### 2. Global State (Zustand)

For app-wide state like auth, settings, theme.

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (credentials) => {
    const { user, token } = await authApi.login(credentials);
    await SecureStorage.setItem('token', token);
    set({ user, token });
  },
  logout: async () => {
    await SecureStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
```

### 3. Server State (TanStack Query)

For data from the backend with caching and synchronization.

```typescript
// useEvents.ts
export const useEvents = (calendarId: number) => {
  return useQuery({
    queryKey: ['events', calendarId],
    queryFn: () => eventsApi.getEvents(calendarId),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.createEvent,
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries(['events', newEvent.calendarId]);
    },
  });
};
```

### State Management Decision Tree

```
Is the state needed across multiple screens?
├── NO → useState/useReducer (local state)
└── YES → Is it server data?
    ├── YES → TanStack Query (server state)
    └── NO → Is it user settings/auth/theme?
        ├── YES → Zustand (global state)
        └── NO → Consider if it should be local
```

---

## Data Flow

### Read Flow (Data Retrieval)

```
1. User opens screen
   ↓
2. Screen component renders
   ↓
3. Custom hook called (e.g., useEvents)
   ↓
4. React Query checks cache
   ├── Cache hit? → Return cached data immediately
   └── Cache miss or stale? → Continue
       ↓
5. Check local database (offline-first)
   ├── Data exists? → Return local data
   └── No data? → Continue
       ↓
6. Check network connection
   ├── Online? → Fetch from API
   │   ↓
   │   7. API Client makes HTTP request
   │   ↓
   │   8. Backend returns data
   │   ↓
   │   9. Update cache and local database
   │   ↓
   │   10. Return data to screen
   └── Offline? → Return local data or show offline message
```

### Write Flow (Data Mutation)

```
1. User performs action (e.g., create event)
   ↓
2. Optimistic update (immediate UI feedback)
   ├── Update local state
   └── Update local database
   ↓
3. Check network connection
   ├── Online? → Send to API immediately
   │   ↓
   │   4. API Client makes HTTP request
   │   ↓
   │   5. Backend processes and returns result
   │   ↓
   │   6. Update cache with server response
   │   ↓
   │   7. Success? → Confirm operation
   │   └── Error? → Rollback optimistic update
   └── Offline? → Queue for background sync
       ↓
       8. Add to sync queue
       ↓
       9. When online, process sync queue
```

---

## Component Hierarchy

### Screen Component Example

```typescript
// CalendarHomeScreen.tsx
export const CalendarHomeScreen = () => {
  // 1. Hooks for data and state
  const { calendars } = useCalendars();
  const { events, isLoading } = useEvents();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const navigation = useNavigation();

  // 2. Event handlers
  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  const handleCreateEvent = () => {
    navigation.navigate('EventCreate');
  };

  // 3. Render
  return (
    <View style={styles.container}>
      <CalendarHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreatePress={handleCreateEvent}
      />
      {viewMode === 'month' && (
        <MonthView events={events} onEventPress={handleEventPress} />
      )}
      {viewMode === 'week' && (
        <WeekView events={events} onEventPress={handleEventPress} />
      )}
      {viewMode === 'day' && (
        <DayView events={events} onEventPress={handleEventPress} />
      )}
      {isLoading && <LoadingOverlay />}
    </View>
  );
};
```

### Component Best Practices

1. **Single Responsibility**: Each component does one thing well
2. **Props Over State**: Pass data down, callbacks up
3. **Memoization**: Use React.memo for expensive renders
4. **Hooks**: Extract reusable logic into custom hooks
5. **Type Safety**: All props and state are typed
6. **Testability**: Pure components are easy to test

---

## Offline-First Strategy

Cal3 Mobile is designed to work seamlessly offline.

### Offline Architecture

```
┌──────────────────────────────────────┐
│        User Interaction              │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│     Local Database (Primary)         │
│  - Events, Calendars, Settings       │
│  - Always available                  │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│        Sync Queue                    │
│  - Pending creates/updates/deletes   │
│  - Processed when online             │
└──────────────┬───────────────────────┘
               ↓
       Network Available?
       ├── YES → Sync with server
       └── NO → Stay in queue
```

### Implementation

```typescript
// Sync Service
class OfflineSyncService {
  private syncQueue: SyncOperation[] = [];

  async queueOperation(operation: SyncOperation) {
    this.syncQueue.push(operation);
    await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));

    if (await this.isOnline()) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue() {
    while (this.syncQueue.length > 0) {
      const operation = this.syncQueue[0];

      try {
        await this.executeOperation(operation);
        this.syncQueue.shift(); // Remove from queue
      } catch (error) {
        console.error('Sync failed:', error);
        break; // Stop processing on error
      }
    }

    await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  private async executeOperation(operation: SyncOperation) {
    switch (operation.type) {
      case 'CREATE_EVENT':
        await eventsApi.createEvent(operation.data);
        break;
      case 'UPDATE_EVENT':
        await eventsApi.updateEvent(operation.id, operation.data);
        break;
      case 'DELETE_EVENT':
        await eventsApi.deleteEvent(operation.id);
        break;
    }
  }
}
```

---

## Security Architecture

### Authentication Flow

```
1. User enters credentials
   ↓
2. API Client sends to backend
   ↓
3. Backend validates credentials
   ↓
4. Backend returns JWT token + user data
   ↓
5. Mobile app stores token securely
   ├── Token → React Native Keychain (encrypted)
   └── User data → AsyncStorage
   ↓
6. All API requests include token in header
   ↓
7. Backend validates token on each request
```

### Secure Storage

```typescript
// Secure Storage Service
import * as Keychain from 'react-native-keychain';

class SecureStorageService {
  async setToken(token: string) {
    await Keychain.setGenericPassword('auth_token', token, {
      service: 'com.cal3.mobile',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    });
  }

  async getToken(): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.cal3.mobile',
    });
    return credentials ? credentials.password : null;
  }

  async removeToken() {
    await Keychain.resetGenericPassword({
      service: 'com.cal3.mobile',
    });
  }
}
```

---

## Performance Optimization

### 1. List Virtualization

Use FlatList for long lists to render only visible items.

```typescript
<FlatList
  data={events}
  renderItem={({ item }) => <EventCard event={item} />}
  keyExtractor={(item) => item.id.toString()}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

### 2. Image Optimization

Use FastImage for optimized image loading.

```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.normal }}
  resizeMode={FastImage.resizeMode.cover}
  style={styles.image}
/>
```

### 3. Memoization

Prevent unnecessary re-renders.

```typescript
const EventCard = React.memo(({ event, onPress }) => (
  <TouchableOpacity onPress={() => onPress(event)}>
    <Text>{event.title}</Text>
  </TouchableOpacity>
));

const expensiveCalculation = useMemo(() => {
  return computeEventStatistics(events);
}, [events]);
```

### 4. Code Splitting

Lazy load screens for faster initial load.

```typescript
const EventDetailScreen = React.lazy(() => import('./EventDetailScreen'));

<Suspense fallback={<LoadingSpinner />}>
  <EventDetailScreen />
</Suspense>
```

---

## Platform-Specific Considerations

### iOS

- Use iOS design patterns (swipe back, modal presentations)
- Handle safe areas (notch, home indicator)
- Configure Info.plist for permissions
- Use iOS-specific date pickers

### Android

- Use Material Design components
- Handle Android back button
- Configure AndroidManifest.xml for permissions
- Use Android-specific date pickers

### Platform Detection

```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
});

if (Platform.OS === 'ios') {
  // iOS-specific code
} else {
  // Android-specific code
}
```

---

## Conclusion

This architecture provides:

- **Scalability**: Easy to add new features
- **Maintainability**: Clear separation of concerns
- **Testability**: Pure functions and dependency injection
- **Performance**: Optimized rendering and data fetching
- **Reliability**: Offline-first with sync
- **Security**: Secure storage and authentication

For implementation details, see the other documentation files.
