# Cal3 Mobile - Testing Guide

This document outlines the testing strategy and guidelines for the Cal3 Mobile application.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing](#unit-testing)
4. [Component Testing](#component-testing)
5. [Integration Testing](#integration-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Manual Testing](#manual-testing)
8. [Performance Testing](#performance-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Testing Checklist](#testing-checklist)

---

## Testing Philosophy

### Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Write Tests First** (TDD): Write failing tests, then make them pass
3. **Keep Tests Fast**: Fast tests run often
4. **Keep Tests Independent**: Tests should not depend on each other
5. **Keep Tests Readable**: Tests are documentation

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Component Tests**: Critical user paths covered
- **Integration Tests**: All API integrations tested
- **E2E Tests**: Happy paths and critical flows

---

## Testing Pyramid

```
        ╱▔▔▔▔▔▔▔╲
       ╱   E2E   ╲     Few, slow, expensive
      ╱▁▁▁▁▁▁▁▁▁▁▁╲
     ╱  Integration ╲   Some, medium speed
    ╱▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁╲
   ╱   Component     ╲  More, faster
  ╱▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁╲
 ╱        Unit         ╲ Many, fast, cheap
╱▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁╲
```

**Distribution**:
- **70%** Unit tests
- **20%** Component/Integration tests
- **10%** E2E tests

---

## Unit Testing

### Setup

**Dependencies**:
```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

**Configuration** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Writing Unit Tests

**Test Utilities**:
```typescript
// src/utils/__tests__/dateHelpers.test.ts
import { formatDate, parseDate, isToday } from '../dateHelpers';

describe('dateHelpers', () => {
  describe('formatDate', () => {
    it('formats date in MM/DD/YYYY format', () => {
      const date = new Date('2025-10-21');
      expect(formatDate(date)).toBe('10/21/2025');
    });

    it('handles invalid dates', () => {
      expect(formatDate(null)).toBe('');
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });
});
```

**Test Services**:
```typescript
// src/services/__tests__/notificationService.test.ts
import { NotificationService } from '../notificationService';
import PushNotification from 'react-native-push-notification';

jest.mock('react-native-push-notification');

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    jest.clearAllMocks();
  });

  it('schedules event reminder 15 minutes before event', async () => {
    const event = {
      id: 1,
      title: 'Meeting',
      startDate: '2025-10-21T14:00:00Z',
    };

    await service.scheduleEventReminder(event);

    expect(PushNotification.localNotificationSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Event starting soon: Meeting',
        date: expect.any(Date),
      })
    );
  });
});
```

### Running Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- dateHelpers.test.ts
```

---

## Component Testing

### Setup

**Testing Library**:
```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

### Writing Component Tests

**Simple Component**:
```typescript
// src/components/common/__tests__/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(<Button title="Click Me" onPress={jest.fn()} />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPress} />);

    fireEvent.press(getByText('Click Me'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    const { getByTestId } = render(
      <Button title="Click Me" onPress={jest.fn()} loading />
    );

    expect(getByTestId('button-loading')).toBeTruthy();
  });

  it('disables button when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPress} disabled />
    );

    fireEvent.press(getByText('Click Me'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
```

**Component with Hooks**:
```typescript
// src/components/calendar/__tests__/MonthView.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MonthView } from '../MonthView';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('MonthView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('displays loading state initially', () => {
    const { getByTestId } = renderWithProviders(<MonthView calendarId={1} />);
    expect(getByTestId('month-view-loading')).toBeTruthy();
  });

  it('displays events after loading', async () => {
    const mockEvents = [
      { id: 1, title: 'Event 1', startDate: '2025-10-21' },
      { id: 2, title: 'Event 2', startDate: '2025-10-22' },
    ];

    // Mock API response
    jest.spyOn(eventsApi, 'getEvents').mockResolvedValue(mockEvents);

    const { getByText } = renderWithProviders(<MonthView calendarId={1} />);

    await waitFor(() => {
      expect(getByText('Event 1')).toBeTruthy();
      expect(getByText('Event 2')).toBeTruthy();
    });
  });
});
```

---

## Integration Testing

### API Integration Tests

```typescript
// src/api/__tests__/events.integration.test.ts
import { eventsApi } from '../events';
import { apiClient } from '../client';

jest.mock('../client');

describe('Events API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches events with calendar ID', async () => {
    const mockEvents = [{ id: 1, title: 'Meeting' }];
    (apiClient.get as jest.Mock).mockResolvedValue(mockEvents);

    const events = await eventsApi.getEvents(1);

    expect(apiClient.get).toHaveBeenCalledWith('/api/events?calendarId=1');
    expect(events).toEqual(mockEvents);
  });

  it('creates event with correct payload', async () => {
    const newEvent = {
      title: 'New Meeting',
      startDate: '2025-10-21',
      isAllDay: false,
      calendarId: 1,
    };
    const createdEvent = { id: 42, ...newEvent };
    (apiClient.post as jest.Mock).mockResolvedValue(createdEvent);

    const result = await eventsApi.createEvent(newEvent);

    expect(apiClient.post).toHaveBeenCalledWith('/api/events', newEvent);
    expect(result).toEqual(createdEvent);
  });

  it('handles API errors gracefully', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(eventsApi.getEvents(1)).rejects.toThrow('Network error');
  });
});
```

---

## End-to-End Testing

### Setup

**Detox** (recommended for React Native E2E):
```bash
npm install --save-dev detox
```

**Configuration** (`.detoxrc.json`):
```json
{
  "testRunner": "jest",
  "runnerConfig": "e2e/config.json",
  "apps": {
    "ios.debug": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/Cal3Mobile.app",
      "build": "xcodebuild -workspace ios/Cal3Mobile.xcworkspace -scheme Cal3Mobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
    },
    "android.debug": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
      "build": "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd .."
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 14 Pro"
      }
    },
    "emulator": {
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_4_API_30"
      }
    }
  }
}
```

### Writing E2E Tests

```typescript
// e2e/login.e2e.ts
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on app launch', async () => {
    await expect(element(by.id('login-screen'))).toBeVisible();
  });

  it('should login successfully with valid credentials', async () => {
    await element(by.id('username-input')).typeText('admin');
    await element(by.id('password-input')).typeText('enterenter');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('calendar-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show error message with invalid credentials', async () => {
    await element(by.id('username-input')).typeText('wrong');
    await element(by.id('password-input')).typeText('wrong');
    await element(by.id('login-button')).tap();

    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });
});
```

**Calendar Flow E2E Test**:
```typescript
// e2e/calendar.e2e.ts
describe('Calendar Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Login
    await element(by.id('username-input')).typeText('admin');
    await element(by.id('password-input')).typeText('enterenter');
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('calendar-screen'))).toBeVisible();
  });

  it('should create a new event', async () => {
    await element(by.id('create-event-button')).tap();

    await element(by.id('event-title-input')).typeText('Team Meeting');
    await element(by.id('event-date-picker')).tap();
    // Select date...
    await element(by.id('save-event-button')).tap();

    await waitFor(element(by.text('Team Meeting')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should delete an event', async () => {
    await element(by.text('Team Meeting')).tap();
    await element(by.id('delete-event-button')).tap();
    await element(by.text('Confirm')).tap();

    await waitFor(element(by.text('Team Meeting')))
      .not.toBeVisible()
      .withTimeout(3000);
  });
});
```

### Running E2E Tests

```bash
# Build app for testing
npm run detox:build:ios
npm run detox:build:android

# Run E2E tests
npm run detox:test:ios
npm run detox:test:android
```

---

## Manual Testing

### Device Testing Matrix

| Device | OS Version | Screen Size | Priority |
|--------|------------|-------------|----------|
| iPhone 14 Pro | iOS 16+ | 6.1" | High |
| iPhone SE (3rd) | iOS 15+ | 4.7" | High |
| iPad Air | iPadOS 16+ | 10.9" | Medium |
| Pixel 7 | Android 13+ | 6.3" | High |
| Samsung Galaxy S21 | Android 12+ | 6.2" | High |
| Older Android | Android 8.0+ | Various | Low |

### Manual Test Cases

#### Authentication Flow
- [ ] Register new account
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout
- [ ] Password reset

#### Calendar Operations
- [ ] View month view
- [ ] View week view
- [ ] View day view
- [ ] Swipe between months/weeks
- [ ] Create event
- [ ] Edit event
- [ ] Delete event
- [ ] Create recurring event

#### Offline Mode
- [ ] View events offline
- [ ] Create event offline
- [ ] Edit event offline
- [ ] Sync when back online
- [ ] Conflict resolution

#### Performance
- [ ] App startup time < 3 seconds
- [ ] Smooth scrolling (60 FPS)
- [ ] No memory leaks
- [ ] Battery usage acceptable

---

## Performance Testing

### React Native Performance Monitor

```typescript
// Enable in development
import { PerformanceObserver, performance } from 'perf_hooks';

if (__DEV__) {
  const obs = new PerformanceObserver((items) => {
    console.log(items.getEntries());
  });
  obs.observe({ entryTypes: ['measure'] });
}
```

### Profiling

**React DevTools Profiler**:
1. Open React DevTools
2. Select Profiler tab
3. Click Record
4. Perform actions
5. Stop recording
6. Analyze render times

**Flipper Performance Monitor**:
1. Open Flipper
2. Enable Performance plugin
3. Monitor FPS, memory, CPU

### Performance Metrics

- **App Startup**: < 3 seconds
- **Screen Navigation**: < 300ms
- **API Response**: < 500ms
- **List Scrolling**: 60 FPS
- **Memory Usage**: < 200 MB

---

## Accessibility Testing

### Screen Reader Testing

**iOS VoiceOver**:
1. Settings → Accessibility → VoiceOver → On
2. Navigate app with swipe gestures
3. Verify all elements have labels
4. Verify reading order is correct

**Android TalkBack**:
1. Settings → Accessibility → TalkBack → On
2. Navigate app with swipe gestures
3. Verify all elements have labels
4. Verify reading order is correct

### Accessibility Checklist

- [ ] All interactive elements have accessibilityLabel
- [ ] Images have accessibilityRole="image"
- [ ] Buttons have accessibilityRole="button"
- [ ] Touch targets ≥ 44pt
- [ ] Color contrast ≥ 4.5:1 (normal text)
- [ ] Color contrast ≥ 3:1 (large text)
- [ ] App works with dynamic text sizes

---

## Testing Checklist

### Pre-Release Testing

**Code Quality**:
- [ ] All unit tests passing
- [ ] All component tests passing
- [ ] All integration tests passing
- [ ] Code coverage ≥ 80%
- [ ] No TypeScript errors
- [ ] No linting errors

**Functionality**:
- [ ] All user flows tested
- [ ] Offline mode tested
- [ ] Push notifications tested
- [ ] Deep linking tested
- [ ] Biometric auth tested

**Performance**:
- [ ] App startup < 3 seconds
- [ ] 60 FPS scrolling
- [ ] No memory leaks
- [ ] Battery usage acceptable

**Accessibility**:
- [ ] Screen reader compatible
- [ ] Touch targets ≥ 44pt
- [ ] Color contrast compliant
- [ ] Dynamic text support

**Devices**:
- [ ] Tested on 3+ iOS devices
- [ ] Tested on 3+ Android devices
- [ ] Tested on tablets
- [ ] Tested on different OS versions

---

## Summary

This guide covers:
- ✅ Testing philosophy and pyramid
- ✅ Unit testing with Jest
- ✅ Component testing with React Native Testing Library
- ✅ Integration testing for API
- ✅ E2E testing with Detox
- ✅ Manual testing checklist
- ✅ Performance testing
- ✅ Accessibility testing

For development workflow, see [DEVELOPMENT.md](DEVELOPMENT.md).
