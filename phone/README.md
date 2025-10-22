# Cal3 Mobile - React Native Android Calendar App

[![React Native](https://img.shields.io/badge/React_Native-0.73+-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Android](https://img.shields.io/badge/Android-8.0%2B-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://www.android.com/)
[![Material Design](https://img.shields.io/badge/Material_Design-3-757575?style=for-the-badge&logo=material-design&logoColor=white)](https://m3.material.io/)

Native Android application for the Cal3 Calendar & Reservation Management System. Built with React Native and TypeScript with Material Design components.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Technology Stack](#technology-stack)
- [Documentation](#documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Status](#project-status)

---

## Overview

Cal3 Mobile is the native Android companion app to the Cal3 web application, providing full-featured calendar and reservation management on Android devices. The app connects to the existing NestJS backend API, ensuring data synchronization across all platforms.

### Key Highlights

- **Android Native**: Optimized for Android 8.0+ devices
- **Material Design 3**: Modern, beautiful UI following latest Material guidelines
- **Feature Parity**: All core web features available on Android
- **Offline-First**: Local data storage with background sync
- **Native Integration**: FCM push notifications, fingerprint/face auth, native calendar sync
- **Performance Optimized**: Smooth 60 FPS animations, fast startup
- **Secure**: JWT authentication with secure keychain storage

---

## Features

### Core Calendar Features

- **Multiple Views**: Month, Week, Day, and Agenda views
- **Event Management**: Create, edit, delete events with full recurrence support
- **Multi-Calendar**: Manage multiple calendars with color coding
- **Time Zones**: Support for 70+ world timezones
- **Search & Filter**: Find events quickly with advanced filtering

### Android-Specific Features

- **Push Notifications**: FCM event reminders and updates
- **Native Calendar Sync**: Two-way sync with Android calendar
- **Biometric Authentication**: Fingerprint, face unlock
- **Offline Mode**: Full offline access with automatic sync
- **Touch Optimized**: Material gestures, long-press actions
- **Pull to Refresh**: Instant data synchronization
- **Dark Mode**: Follows system dark mode settings
- **Notification Channels**: Organized Android 8.0+ notifications

### Advanced Features

- **Automation System**: Rule-based event automation
- **Reservation Management**: Complete booking system
- **Organization Support**: Multi-tenant organization management
- **Admin Panel**: User and system management (tablet-optimized)
- **Theme Customization**: 16 beautiful color themes

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Java Development Kit (JDK)** 11 or 17
- **Android Development**:
  - Android Studio (latest version)
  - Android SDK (API 26+, target API 33+)
  - Android Emulator or physical device with USB debugging

### Installation

```bash
# Clone the repository
git clone https://github.com/Csepi/cal3.git
cd cal3/phone

# Install dependencies
npm install

# Start Metro bundler
npm start
```

### Running the App

```bash
# Run on Android emulator (must be started first)
npm run android

# Run on specific Android emulator
npm run android -- --deviceId=emulator-5554

# Run on physical Android device (USB debugging enabled)
npm run android
```

### Backend Connection

The mobile app connects to the Cal3 backend API. Configure the API URL in `src/constants/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8081', // Development
  // BASE_URL: 'https://your-production-api.com', // Production
  TIMEOUT: 30000,
};
```

**Note**: For Android emulator, use `http://10.0.2.2:8081`. For physical Android device, use your computer's IP address (e.g., `http://192.168.1.100:8081`).

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.73+ | Mobile framework |
| TypeScript | 5.8+ | Type safety |
| React Navigation | 6.x | Navigation |
| TanStack Query | 5.x | Server state management |
| Zustand | 4.x | Global state management |

### Mobile Features

| Library | Purpose |
|---------|---------|
| react-native-keychain | Secure token storage |
| react-native-push-notification | Push notifications |
| react-native-biometrics | Biometric authentication |
| react-native-calendar-events | Native calendar integration |
| react-native-gesture-handler | Gesture recognition |
| react-native-reanimated | Smooth animations |

### UI Components

| Library | Purpose |
|---------|---------|
| React Native Paper | Material Design components |
| react-native-vector-icons | Icon library |
| Custom Components | Cal3 design system |

---

## Documentation

Comprehensive documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | App architecture and design patterns |
| [API_INTEGRATION.md](docs/API_INTEGRATION.md) | Backend API integration guide |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | UI/UX guidelines and components |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Development setup and workflow |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | App Store and Play Store deployment |
| [TESTING.md](docs/TESTING.md) | Testing strategy and guidelines |

---

## Development

### Project Structure

```
phone/
├── src/
│   ├── api/              # API integration
│   ├── components/       # Reusable components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation config
│   ├── store/            # State management
│   ├── hooks/            # Custom hooks
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── constants/        # App constants
│   ├── services/         # Business services
│   └── database/         # Local database
├── android/              # Android native code
├── ios/                  # iOS native code
└── __tests__/            # Test files
```

### Available Scripts

```bash
# Development
npm start                # Start Metro bundler
npm run ios              # Run on iOS
npm run android          # Run on Android

# Testing
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # TypeScript check
npm run format           # Format with Prettier

# Building
npm run build:ios        # Build iOS app
npm run build:android    # Build Android app
```

### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Edit files, follow code style guide
3. **Run Tests**: `npm test` and `npm run typecheck`
4. **Test on Devices**: Test on both iOS and Android
5. **Commit**: Use conventional commit messages
6. **Push**: Push to remote branch
7. **Pull Request**: Create PR for review

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed workflow.

---

## Testing

### Test Levels

- **Unit Tests**: Jest for utilities and services
- **Component Tests**: React Native Testing Library
- **Integration Tests**: API integration tests
- **E2E Tests**: Detox for end-to-end testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e:ios     # iOS E2E
npm run test:e2e:android # Android E2E
```

See [TESTING.md](docs/TESTING.md) for testing guidelines.

---

## Deployment

### iOS Deployment

1. Configure signing in Xcode
2. Archive the app
3. Upload to App Store Connect
4. Submit for review

### Android Deployment

1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Submit for review

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guide.

---

## Project Status

### Current Phase

**Phase 1: Project Setup & Architecture** (In Progress)

- ✅ Git branch created
- ✅ Directory structure created
- ✅ Documentation written (Android-focused)
- ⏳ React Native Android project initialization
- ⏳ Android development environment setup

### Roadmap

| Phase | Status | Timeline |
|-------|--------|----------|
| Phase 1: Setup & Architecture | In Progress | Week 1-2 |
| Phase 2: Core Infrastructure | Planned | Week 3-4 |
| Phase 3: Material Design UI | Planned | Week 5-6 |
| Phase 4: Feature Implementation | Planned | Week 7-9 |
| Phase 5: Android Features | Planned | Week 10 |
| Phase 6: Optimization & Testing | Planned | Week 11 |

### Feature Implementation Status

#### MVP Features (Must Have)
- ⏳ Authentication (Login, Register)
- ⏳ Calendar Views (Month, Week, Day)
- ⏳ Event Management (CRUD)
- ⏳ User Profile
- ⏳ API Integration

#### Core Features (Should Have)
- ⏳ Recurring Events
- ⏳ Event Search
- ⏳ Automation System
- ⏳ Push Notifications
- ⏳ Offline Mode

#### Advanced Features (Nice to Have)
- ⏳ Reservation System
- ⏳ Native Calendar Sync
- ⏳ Biometric Auth
- ⏳ Admin Panel

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│   Android App (React Native)        │
├─────────────────────────────────────┤
│  Screens → Hooks → API/Database     │
│  Material Design 3 Components       │
│  Android Navigation & Back Button   │
└─────────────────────────────────────┘
              ↓ REST API
┌─────────────────────────────────────┐
│      Cal3 Backend (NestJS)          │
│   PostgreSQL @ 192.168.1.101:5433   │
└─────────────────────────────────────┘
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture.

---

## Design System

### Theme Colors (16 Rainbow Colors)

The app supports 16 theme colors matching the web application:

- Red, Orange, Yellow, Lime
- Green, Emerald, Teal, Cyan
- Sky, Blue, Indigo, Violet
- Purple, Pink, Rose, Slate

### Spacing System

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

### Typography

- **Display**: 32px, bold
- **Heading**: 24px, semi-bold
- **Title**: 20px, semi-bold
- **Body**: 16px, regular
- **Caption**: 14px, regular
- **Small**: 12px, regular

See [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for complete design guidelines.

---

## API Integration

The mobile app connects to the Cal3 NestJS backend API:

- **Base URL**: Configurable (localhost for dev, production URL for release)
- **Authentication**: JWT tokens stored in keychain
- **Endpoints**: 40+ REST endpoints
- **Caching**: TanStack Query for smart caching
- **Offline**: Local database with sync queue

See [API_INTEGRATION.md](docs/API_INTEGRATION.md) for API details.

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes following code style guide
4. Write tests for new features
5. Ensure all tests pass: `npm test && npm run typecheck`
6. Commit: `git commit -m 'feat: add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Create Pull Request

### Code Style

- Follow TypeScript strict mode
- Use functional components with hooks
- Follow React Native best practices
- Write meaningful test coverage
- Document complex logic

---

## Troubleshooting

### Common Issues

**Metro Bundler Won't Start**
```bash
# Clear cache and restart
npm start -- --reset-cache
```

**iOS Build Fails**
```bash
# Clean and reinstall pods
cd ios && rm -rf Pods && pod install && cd ..
```

**Android Build Fails**
```bash
# Clean Gradle cache
cd android && ./gradlew clean && cd ..
```

**App Crashes on Startup**
```bash
# Check logs
npx react-native log-ios      # iOS logs
npx react-native log-android  # Android logs
```

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for more troubleshooting tips.

---

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## Links

- **Web App**: [Cal3 Web Application](../frontend)
- **Backend**: [Cal3 Backend API](../backend-nestjs)
- **Main README**: [Project Overview](../README.md)
- **Mobile App Plan**: [Development Plan](../MOBILE_APP_PLAN.md)

---

## Support

For issues and questions:

- **Issues**: [GitHub Issues](https://github.com/Csepi/cal3/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Csepi/cal3/discussions)
- **Documentation**: [docs/](docs/)

---

**Cal3 Mobile** - Your calendar, everywhere you go. Built with ❤️ using React Native.
