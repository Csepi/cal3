# Cal3 Mobile - Development Guide

This document provides comprehensive guidance for developing the Cal3 Mobile application.

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Running the App](#running-the-app)
3. [Development Workflow](#development-workflow)
4. [Code Style Guide](#code-style-guide)
5. [Project Structure](#project-structure)
6. [Common Tasks](#common-tasks)
7. [Debugging](#debugging)
8. [Troubleshooting](#troubleshooting)

---

## Environment Setup

### Prerequisites

**Required Software**:
- **Node.js** 18+ and npm
- **Git** for version control
- **Code Editor**: VS Code recommended

**iOS Development** (macOS only):
- **Xcode** 14+ from App Store
- **CocoaPods**: `sudo gem install cocoapods`
- **Xcode Command Line Tools**: `xcode-select --install`

**Android Development** (Windows, macOS, Linux):
- **Android Studio** (includes Android SDK)
- **Java Development Kit (JDK)** 11 or newer
- **Android SDK** (API Level 26+)

### Initial Setup

#### 1. Clone Repository

```bash
git clone https://github.com/Csepi/cal3.git
cd cal3
git checkout phone
cd phone
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

#### 4. Android Setup

Open `phone/android` in Android Studio and let it sync Gradle files.

**Configure Android SDK** (if not done):
1. Open Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
2. Install Android SDK Platform 26+ and Android SDK Build-Tools
3. Add to PATH (add to `~/.zshrc` or `~/.bashrc`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk        # Linux
# export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### 5. Configure Backend API URL

Edit `src/constants/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? Platform.OS === 'ios'
      ? 'http://localhost:8081'           // iOS Simulator
      : 'http://10.0.2.2:8081'             // Android Emulator
    : 'https://your-production-api.com',   // Production
  TIMEOUT: 30000,
};
```

**Important**:
- iOS Simulator can use `localhost`
- Android Emulator must use `10.0.2.2` (special alias for host machine)
- Physical devices must use your computer's IP address (e.g., `http://192.168.1.100:8081`)

---

## Running the App

### Start Metro Bundler

```bash
npm start
```

Keep this running in a separate terminal.

### Run on iOS

```bash
# Run on iOS Simulator (default device)
npm run ios

# Run on specific simulator
npm run ios -- --simulator="iPhone 14 Pro"

# Run on physical device (requires setup)
npm run ios -- --device
```

**First-time setup**:
- Metro bundler will start automatically
- Xcode will build the app (takes several minutes first time)
- App will launch in iOS Simulator

### Run on Android

```bash
# Run on Android Emulator (must be running first)
npm run android

# Run on specific emulator
npm run android -- --deviceId=emulator-5554

# Run on physical device (USB debugging enabled)
npm run android
```

**First-time setup**:
1. Start Android Emulator from Android Studio (AVD Manager)
2. Or connect physical device with USB debugging enabled
3. Run `npm run android`
4. Gradle will build the app (takes several minutes first time)
5. App will launch on emulator/device

### Development Mode Features

When running in development mode (\`__DEV__ === true\`):
- Hot reload enabled (changes appear instantly)
- Developer menu accessible:
  - **iOS**: Cmd+D in Simulator, shake physical device
  - **Android**: Cmd+M (macOS) / Ctrl+M (Windows/Linux), shake physical device
- Redux DevTools enabled
- Detailed error messages
- Source maps enabled

---

## Development Workflow

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes, commit frequently
git add .
git commit -m "feat: add calendar event filtering"

# 3. Push to remote
git push origin feature/your-feature-name

# 4. Create Pull Request on GitHub
# 5. After review and approval, merge to phone branch
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build process, dependencies

**Examples**:
```
feat(calendar): add month view swipe navigation
fix(auth): resolve token refresh infinite loop
docs(readme): update installation instructions
refactor(api): extract auth interceptor to separate file
```

### Daily Development Cycle

1. **Pull latest changes**:
   ```bash
   git pull origin phone
   ```

2. **Start development servers**:
   ```bash
   # Terminal 1: Backend (from backend-nestjs/)
   PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev

   # Terminal 2: Metro (from phone/)
   npm start

   # Terminal 3: Run app (from phone/)
   npm run ios  # or npm run android
   ```

3. **Make changes**:
   - Edit files
   - Hot reload applies changes automatically
   - Test on simulator/emulator

4. **Test changes**:
   ```bash
   npm test
   npm run typecheck
   npm run lint
   ```

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: your feature"
   git push
   ```

---

## Code Style Guide

### TypeScript

**Use strict mode**:
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Type everything**:
```typescript
// Good
interface Event {
  id: number;
  title: string;
  startDate: string;
}

const getEvent = (id: number): Promise<Event> => {
  return eventsApi.getEvent(id);
};

// Bad
const getEvent = (id) => {
  return eventsApi.getEvent(id);
};
```

### React Components

**Use functional components with hooks**:
```typescript
// Good
export const CalendarScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return <View>...</View>;
};

// Avoid class components
```

**Extract logic to custom hooks**:
```typescript
// Good
export const CalendarScreen = () => {
  const { events, isLoading, createEvent } = useEvents();
  // ...
};

// Avoid putting logic in components
```

**Memoize expensive components**:
```typescript
export const EventCard = React.memo<EventCardProps>(({ event }) => {
  return <View>...</View>;
});
```

### File Naming

- **Components**: PascalCase (e.g., `CalendarScreen.tsx`, `EventCard.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useEvents.ts`, `useAuth.ts`)
- **Utils**: camelCase (e.g., `dateHelpers.ts`, `validation.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_CONFIG`, `THEME_COLORS`)

### Folder Organization

```
src/
├── api/              # API clients (camelCase)
├── components/       # Components (PascalCase)
├── screens/          # Screen components (PascalCase)
├── hooks/            # Custom hooks (camelCase)
├── types/            # TypeScript types (PascalCase)
├── utils/            # Utilities (camelCase)
├── constants/        # Constants (camelCase files)
└── services/         # Services (camelCase)
```

### Imports

**Order imports**:
1. React imports
2. Third-party libraries
3. Project imports (absolute paths)
4. Relative imports
5. Types

```typescript
// 1. React
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// 2. Third-party
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';

// 3. Project (absolute)
import { eventsApi } from '@/api/events';
import { Button } from '@/components/common/Button';

// 4. Relative
import { EventCard } from './EventCard';
import { styles } from './styles';

// 5. Types
import type { Event } from '@/types/Event';
```

### Styling

**Use StyleSheet.create**:
```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

**Avoid inline styles** (except for dynamic values):
```typescript
// Good
<View style={styles.container}>
  <Text style={[styles.title, { color: themeColor }]}>Title</Text>
</View>

// Avoid
<View style={{ flex: 1, padding: 16 }}>
  <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Title</Text>
</View>
```

---

## Project Structure

```
phone/
├── android/                 # Android native code
├── ios/                     # iOS native code
├── src/
│   ├── api/                # API integration
│   │   ├── client.ts       # Base API client
│   │   ├── auth.ts         # Auth endpoints
│   │   ├── events.ts       # Event endpoints
│   │   └── ...
│   ├── components/         # Reusable components
│   │   ├── common/         # Shared UI components
│   │   ├── calendar/       # Calendar components
│   │   ├── events/         # Event components
│   │   └── ...
│   ├── screens/            # Screen components
│   │   ├── Auth/
│   │   ├── Calendar/
│   │   ├── Events/
│   │   └── ...
│   ├── navigation/         # Navigation setup
│   ├── store/              # State management
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   ├── constants/          # Constants
│   ├── services/           # Business services
│   └── App.tsx             # Root component
├── __tests__/              # Test files
├── package.json
├── tsconfig.json
└── README.md
```

---

## Common Tasks

### Adding a New Screen

1. **Create screen component**:
```typescript
// src/screens/Calendar/EventDetailScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';

export const EventDetailScreen = ({ route }) => {
  const { eventId } = route.params;

  return (
    <View>
      <Text>Event Detail: {eventId}</Text>
    </View>
  );
};
```

2. **Add to navigator**:
```typescript
// src/navigation/CalendarNavigator.tsx
<Stack.Screen
  name="EventDetail"
  component={EventDetailScreen}
  options={{ title: 'Event Details' }}
/>
```

3. **Navigate to screen**:
```typescript
navigation.navigate('EventDetail', { eventId: event.id });
```

### Adding a New API Endpoint

1. **Add to API client**:
```typescript
// src/api/events.ts
export const eventsApi = {
  // ... existing methods

  searchEvents: (query: string) =>
    apiClient.get<Event[]>(`/api/events/search?q=${encodeURIComponent(query)}`),
};
```

2. **Create custom hook**:
```typescript
// src/hooks/useEventSearch.ts
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events';

export const useEventSearch = (query: string) => {
  return useQuery({
    queryKey: ['events', 'search', query],
    queryFn: () => eventsApi.searchEvents(query),
    enabled: query.length > 0,
  });
};
```

3. **Use in component**:
```typescript
const { data: events, isLoading } = useEventSearch(searchQuery);
```

### Adding a New Component

1. **Create component file**:
```typescript
// src/components/calendar/MonthGrid.tsx
interface MonthGridProps {
  events: Event[];
  onEventPress: (event: Event) => void;
}

export const MonthGrid: React.FC<MonthGridProps> = ({ events, onEventPress }) => {
  return <View>{/* Implementation */}</View>;
};

const styles = StyleSheet.create({
  // Styles
});
```

2. **Export from index** (if using barrel exports):
```typescript
// src/components/calendar/index.ts
export { MonthGrid } from './MonthGrid';
export { WeekView } from './WeekView';
```

### Installing a New Package

```bash
# Install package
npm install package-name

# Install types (if available)
npm install --save-dev @types/package-name

# iOS: Update pods
cd ios && pod install && cd ..

# Rebuild app
npm run ios   # or npm run android
```

---

## Debugging

### React Native Debugger

1. **Install**:
   ```bash
   brew install --cask react-native-debugger  # macOS
   ```

2. **Enable**:
   - Open React Native Debugger
   - In app, open Developer Menu (Cmd+D / Cmd+M)
   - Select "Debug" or "Debug JS Remotely"

### Flipper

1. **Install**: Download from https://fbflipper.com/

2. **Features**:
   - Network inspector
   - React DevTools
   - Redux DevTools
   - Layout inspector
   - Crash reporter

### Console Logging

```typescript
// Development logging
console.log('User logged in:', user);
console.warn('Token expiring soon');
console.error('API request failed:', error);

// Production: Use logging service
if (__DEV__) {
  console.log('Debug info');
} else {
  // Send to analytics/error tracking
}
```

### Debugging Tools

```typescript
// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  {__DEV__ && <ReactQueryDevtools />}
</QueryClientProvider>
```

---

## Troubleshooting

### Metro Bundler Issues

**Problem**: Metro won't start or shows errors

**Solution**:
```bash
# Clear Metro cache
npm start -- --reset-cache

# Or manually delete cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
```

### iOS Build Fails

**Problem**: Xcode build fails with pod errors

**Solution**:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
npm run ios
```

**Problem**: "No bundle URL present" error

**Solution**:
- Ensure Metro bundler is running (`npm start`)
- In Xcode: Product → Clean Build Folder
- Rebuild app

### Android Build Fails

**Problem**: Gradle sync fails

**Solution**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**Problem**: "SDK location not found"

**Solution**:
Create `android/local.properties`:
```
sdk.dir=/Users/USERNAME/Library/Android/sdk  # macOS
# sdk.dir=/home/USERNAME/Android/Sdk         # Linux
# sdk.dir=C\:\\Users\\USERNAME\\AppData\\Local\\Android\\Sdk  # Windows
```

### App Crashes on Startup

**Problem**: App crashes immediately

**Solution**:
1. Check console logs: `npx react-native log-ios` or `npx react-native log-android`
2. Look for JavaScript errors in Metro bundler console
3. Check for missing dependencies: `npm install`
4. Rebuild app: `npm run ios` / `npm run android`

### Network Request Fails

**Problem**: API requests return network errors

**Solution**:
1. **iOS Simulator**: Use `http://localhost:8081`
2. **Android Emulator**: Use `http://10.0.2.2:8081`
3. **Physical Device**: Use computer's IP address (e.g., `http://192.168.1.100:8081`)
4. Ensure backend is running: `cd backend-nestjs && PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev`

### Hot Reload Not Working

**Problem**: Changes don't appear automatically

**Solution**:
- Enable hot reload: Developer Menu → Enable Hot Reloading
- Manually reload: Shake device → Reload
- Restart Metro: `npm start -- --reset-cache`

---

## Performance Tips

### Optimize Renders

```typescript
// Use React.memo for expensive components
export const EventCard = React.memo(({ event }) => {
  // ...
});

// Use useCallback for callbacks
const handlePress = useCallback(() => {
  navigation.navigate('EventDetail', { eventId: event.id });
}, [event.id, navigation]);

// Use useMemo for expensive calculations
const sortedEvents = useMemo(() => {
  return events.sort((a, b) => a.startDate.localeCompare(b.startDate));
}, [events]);
```

### Optimize Lists

```typescript
// Use FlatList for long lists
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

### Optimize Images

```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.normal }}
  resizeMode={FastImage.resizeMode.cover}
  style={styles.image}
/>
```

---

## Summary

This guide covers:
- ✅ Environment setup for iOS and Android
- ✅ Running the app on simulators/emulators
- ✅ Development workflow and Git conventions
- ✅ Code style guide and best practices
- ✅ Common development tasks
- ✅ Debugging tools and techniques
- ✅ Troubleshooting common issues

For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md).
For API integration, see [API_INTEGRATION.md](API_INTEGRATION.md).
