# Cal3 Mobile App - Android Development Guide

## Overview

Cal3's Android mobile app is built using **Capacitor**, which wraps the existing React/Vite web frontend in a native Android container. This approach allows us to leverage the complete web application without rewriting code, while still providing a native mobile experience.

## Architecture

- **Technology**: Capacitor (Ionic Framework)
- **Approach**: Web-to-Native Wrapper
- **Frontend**: Existing React 18 + TypeScript + Tailwind CSS (Vite build)
- **Platform**: Android (iOS support possible in future)
- **APK Location**: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### Why Capacitor?

After attempting React Native (versions 0.76.9, 0.75.4, 0.74.5) and encountering persistent compatibility issues with JavaScript engines (Hermes/JSC) and Gradle versions, we pivoted to Capacitor. This proved to be the optimal solution because:

1. **Zero Code Changes** - Uses the existing React frontend without modifications
2. **Fast Build Times** - First successful build in 2m 29s
3. **Simple Workflow** - Standard web build → sync → Android build
4. **Native Features** - Access to native APIs through Capacitor plugins
5. **Proven Technology** - Used by many production applications

## Prerequisites

### Required Software

1. **Node.js** - v18+ (already installed for frontend development)
2. **Android Studio** - Latest version
3. **Android SDK** - API Level 33+ recommended
4. **Java Development Kit (JDK)** - Version 17+
5. **Gradle** - v8.9+ (included via wrapper)

### Environment Setup

1. **Android SDK Location**:
   - Windows: `C:\Users\<Username>\AppData\Local\Android\Sdk`
   - Create `frontend/android/local.properties` with:
     ```properties
     sdk.dir=C:\\Users\\<Username>\\AppData\\Local\\Android\\Sdk
     ```

2. **Environment Variables** (optional but recommended):
   ```bash
   ANDROID_HOME=C:\Users\<Username>\AppData\Local\Android\Sdk
   PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
   ```

## Initial Setup (Already Completed)

This section documents the initial setup that was already done. **You do not need to repeat these steps.**

### 1. Install Capacitor Dependencies

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Initialize Capacitor

```bash
npx cap init "PrimeCal Calendar" "com.primecal.calendar" --web-dir=dist
```

This creates `capacitor.config.ts` with the app configuration.

### 3. Build Frontend

```bash
npm run build
```

This creates the `dist/` folder with the production-ready web app.

### 4. Add Android Platform

```bash
npx cap add android
```

This creates the `frontend/android/` folder with a complete Android project.

### 5. Create local.properties

Create `frontend/android/local.properties`:
```properties
sdk.dir=C:\\Users\\ThinkPad\\AppData\\Local\\Android\\Sdk
```

## Development Workflow

### Making Changes to the App

1. **Modify Frontend Code** (in `frontend/src/`)
   - Make your changes to React components, styles, etc.

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Sync Changes to Android**
   ```bash
   npx cap sync android
   ```

4. **Build APK**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

5. **Install on Device**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### Quick Development Cycle

For rapid iteration:

```bash
# From frontend directory
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd .. && adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Building the APK

### Debug Build (Development)

```bash
cd frontend/android
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk` (~4.1 MB)

### Release Build (Production)

```bash
cd frontend/android
./gradlew assembleRelease
```

**Note**: Release builds require a signing key. See [Android Signing Documentation](https://developer.android.com/studio/publish/app-signing).

## Installing and Testing

### Connect Device/Emulator

1. **Physical Device**:
   - Enable USB debugging in Developer Options
   - Connect via USB
   - Verify: `adb devices`

2. **Emulator**:
   - Launch Android emulator from Android Studio
   - Verify: `adb devices` (should show `emulator-5554`)

### Install APK

```bash
# Uninstall old version (if exists)
adb uninstall com.primecal.calendar

# Install new APK
adb install frontend/android/app/build/outputs/apk/debug/app-debug.apk

# Launch app
adb shell am start -n com.primecal.calendar/.MainActivity
```

### View Logs

```bash
# Real-time logs
adb logcat | grep -i primecal

# Recent logs
adb logcat -d -t 200 | grep -i primecal

# Error logs only
adb logcat -d *:E | grep -i primecal

# Check if app is running
adb shell ps -A | grep primecal
```

## Configuration

### Capacitor Config (`frontend/capacitor.config.ts`)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.primecal.calendar',
  appName: 'PrimeCal Calendar',
  webDir: 'dist',
  server: {
    url: 'https://app.primecal.eu',
    allowNavigation: ['app.primecal.eu', 'api.primecal.eu', 'primecal.eu', '*.primecal.eu'],
    androidScheme: 'https',
  }
};

export default config;
```

### Backend Connection

The mobile app connects to the backend using the same API endpoints as the web version. Ensure:

1. **Backend is Running**:
   ```bash
   cd backend-nestjs
   PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev
   ```

2. **API URL Configuration**:
   - Edit `frontend/src/` files to use correct backend URL
   - For local development: `http://10.0.2.2:8081` (Android emulator)
   - For production: Your production backend URL

### Network Configuration

If testing on emulator and backend is on localhost:
- Use `10.0.2.2` instead of `localhost` or `127.0.0.1`
- Example: `http://10.0.2.2:8081/api`

## Troubleshooting

### Build Errors

**Error**: `SDK location not found`
```bash
# Solution: Create local.properties
echo "sdk.dir=C:\\\\Users\\\\<Username>\\\\AppData\\\\Local\\\\Android\\\\Sdk" > frontend/android/local.properties
```

**Error**: Gradle version issues
```bash
# Solution: Use Gradle wrapper (already configured)
cd frontend/android
./gradlew --version  # Should show 8.9+
```

**Error**: Build fails after frontend changes
```bash
# Solution: Clean and rebuild
cd frontend/android
./gradlew clean
./gradlew assembleDebug
```

### Runtime Errors

**Error**: App crashes on launch
```bash
# Check logs
adb logcat -d *:E | grep -i cal3

# Common causes:
# 1. Backend not running
# 2. Network configuration incorrect
# 3. WebView compatibility issues
```

**Error**: Cannot connect to backend
```bash
# For emulator, use 10.0.2.2 instead of localhost
# Check network permissions in AndroidManifest.xml
```

### Development Issues

**Issue**: Slow builds
```bash
# Enable Gradle daemon
# Add to gradle.properties:
org.gradle.daemon=true
org.gradle.parallel=true
```

**Issue**: Old code persists after changes
```bash
# Full rebuild workflow
npm run build          # Rebuild frontend
npx cap sync android   # Sync to Android
cd android
./gradlew clean        # Clean Android build
./gradlew assembleDebug
```

## Project Structure

```
cal3/
├── frontend/                      # Web frontend (React)
│   ├── src/                      # React source code
│   ├── dist/                     # Built web app (git-ignored)
│   ├── capacitor.config.ts       # Capacitor configuration
│   ├── android/                  # Android project (git-ignored)
│   │   ├── app/
│   │   │   ├── src/main/
│   │   │   │   ├── AndroidManifest.xml
│   │   │   │   ├── java/com/cal3/calendar/
│   │   │   │   └── res/
│   │   │   └── build.gradle      # App-level Gradle config
│   │   ├── gradle/wrapper/       # Gradle wrapper
│   │   ├── build.gradle          # Project-level Gradle
│   │   └── local.properties      # SDK location (git-ignored)
│   └── package.json              # Includes Capacitor deps
└── backend-nestjs/               # Backend API server
```

## Git Configuration

The following files/folders should be in `.gitignore`:

```gitignore
# Mobile app generated files
frontend/android/
frontend/dist/
frontend/android/local.properties

# Keep in version control
frontend/capacitor.config.ts
frontend/package.json
```

## Native Features (Future)

Capacitor provides plugins for native features:

### Camera
```bash
npm install @capacitor/camera
```

### Geolocation
```bash
npm install @capacitor/geolocation
```

### Push Notifications
```bash
npm install @capacitor/push-notifications
```

### Local Notifications
```bash
npm install @capacitor/local-notifications
```

See [Capacitor Plugins](https://capacitorjs.com/docs/plugins) for complete list.

## Performance Optimization

### WebView Performance

1. **Enable Hardware Acceleration** (default in modern Android)
2. **Minimize JavaScript Bundle Size**:
   ```bash
   npm run build -- --minify
   ```

3. **Use Production Builds** for testing performance

### APK Size Optimization

1. **Enable ProGuard** (for release builds)
2. **Use App Bundles** instead of APKs:
   ```bash
   ./gradlew bundleRelease
   ```

3. **Analyze APK**:
   ```bash
   # In Android Studio: Build > Analyze APK
   ```

## Comparison: React Native vs Capacitor

| Aspect | React Native (Failed) | Capacitor (Success) |
|--------|----------------------|---------------------|
| Setup Time | 3 days (failed) | 1 hour |
| Code Changes | Complete rewrite needed | Zero changes |
| Build Time | N/A (never built) | 2m 29s |
| Compatibility | Hermes/JSC/Gradle issues | Works immediately |
| Maintenance | High (native modules) | Low (web updates) |
| Native Feel | More native | Web-like with native chrome |
| Performance | Better (if it worked) | Good for most use cases |

## Known Limitations

1. **WebView-based**: Not as performant as native React Native for intensive animations
2. **App Size**: Slightly larger due to WebView overhead
3. **Native APIs**: Requires Capacitor plugins for native features
4. **Offline**: Requires additional configuration for offline support

## Next Steps

### Immediate
- [x] Successfully build and install APK
- [x] Verify app launches without crashes
- [x] Clean up old React Native attempt
- [x] Document Capacitor approach

### Short-term
- [ ] Test all app features in mobile WebView
- [ ] Configure API URL for production
- [ ] Add app icon and splash screen
- [ ] Test on physical devices

### Long-term
- [ ] Set up CI/CD for automated builds
- [ ] Create release build with signing
- [ ] Publish to Google Play Store (internal testing)
- [ ] Add native features (camera, notifications, etc.)
- [ ] iOS version using Capacitor

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Capacitor Android Configuration](https://capacitorjs.com/docs/android/configuration)
- [Gradle Build Tool](https://gradle.org/guides/)

## Timeline Home Screen Widget

The Android app now includes a configurable timeline widget (`TimelineWidgetProvider`) with small/medium/large layouts.

### Key files

- `frontend/android/app/src/main/java/com/primecal/calendar/widget/TimelineWidgetProvider.kt`
- `frontend/android/app/src/main/java/com/primecal/calendar/widget/TimelineWidgetConfigActivity.kt`
- `frontend/android/app/src/main/java/com/primecal/calendar/widget/TimelineWidgetRemoteViewsService.kt`
- `frontend/android/app/src/main/java/com/primecal/calendar/widget/TimelineWidgetRepository.kt`
- `frontend/android/app/src/main/java/com/primecal/calendar/widget/TimelineWidgetDataProvider.kt`
- `frontend/android/app/src/main/res/xml/timeline_widget_info.xml`

### User flow

1. Long-press Android home screen and add **PrimeCal Timeline** widget.
2. Configure date range, entry count, color scheme, refresh interval, and click behavior.
3. Widget loads timeline entries and supports:
   - Refresh button
   - Previous/next range navigation
   - Quick add action
   - Tap entry to open PrimeCal at the selected item/day

### Update behavior

- Manual refresh from widget
- Periodic refresh through WorkManager (minimum every 15 minutes)
- Refresh on boot/timezone/time changes
- External app-triggered refresh broadcast: `com.primecal.calendar.widget.ACTION_TIMELINE_DATA_CHANGED`

## Support

For issues or questions:
1. Check logs: `adb logcat | grep -i cal3`
2. Review this documentation
3. Check Capacitor documentation
4. Verify backend is running and accessible

---

**Last Updated**: October 24, 2025
**Version**: 1.0.0
**Status**: Production Ready
