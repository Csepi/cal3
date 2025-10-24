# Cal3 Mobile Build Scripts

This folder contains convenient batch scripts for building the Cal3 Android mobile app.

## Available Scripts

### 1. `build-mobile.bat` - Basic Build
**Purpose**: Simple build script that creates the APK without installation.

**Usage**:
```cmd
build-mobile.bat
```

**What it does**:
1. Builds the React frontend with Vite
2. Syncs Capacitor to Android
3. Builds the Android APK
4. Shows the APK location and size

**Best for**: Creating APK for manual distribution or when device is not connected.

---

### 2. `build-and-install-mobile.bat` - Build + Install
**Purpose**: Complete build and installation script with device detection.

**Usage**:
```cmd
build-and-install-mobile.bat
```

**What it does**:
1. Builds the React frontend with Vite
2. Syncs Capacitor to Android
3. Builds the Android APK
4. Detects connected Android devices
5. Prompts to install the APK (if device connected)
6. Prompts to launch the app (if installed)

**Best for**: Full development workflow - build, test, and run on device/emulator.

**Interactive prompts**:
- "Do you want to install the APK now? [Y/N]"
- "Do you want to launch the app now? [Y/N]"

---

### 3. `rebuild-mobile-quick.bat` - Quick Rebuild
**Purpose**: Fast rebuild for iterative development (no clean, uses Gradle cache).

**Usage**:
```cmd
rebuild-mobile-quick.bat
```

**What it does**:
1. Builds frontend
2. Syncs to Android
3. Uses incremental Gradle build (much faster)

**Best for**: Rapid development iterations when making small changes.

**Speed**: ~30-60 seconds for incremental builds vs 2-3 minutes for full builds.

---

## Prerequisites

Before running any script, ensure you have:

1. **Node.js** installed (v18+)
2. **Android SDK** installed
3. **Environment setup**:
   - `frontend/android/local.properties` exists with SDK path
   - `adb` in PATH (for install scripts)
4. **Dependencies installed**:
   ```cmd
   cd frontend
   npm install
   ```

## Workflow Examples

### First Time Setup
```cmd
cd c:\Users\ThinkPad\cal3
build-mobile.bat
```

### Development Workflow
```cmd
# Make code changes in frontend/src/

# Quick rebuild and test
rebuild-mobile-quick.bat

# If you want to install and run
build-and-install-mobile.bat
```

### Creating APK for Distribution
```cmd
# Build without installing
build-mobile.bat

# APK will be at:
# frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

## Troubleshooting

### Error: "npm is not recognized"
**Solution**: Ensure Node.js is installed and in PATH
```cmd
node --version
npm --version
```

### Error: "gradlew.bat not found"
**Solution**: Run Capacitor sync first
```cmd
cd frontend
npx cap sync android
```

### Error: "SDK location not found"
**Solution**: Create `frontend/android/local.properties`
```properties
sdk.dir=C:\\Users\\<Username>\\AppData\\Local\\Android\\Sdk
```

### Build is slow
**Solution**: Use `rebuild-mobile-quick.bat` for incremental builds

### APK installation fails
**Solution**: Check device connection
```cmd
adb devices
```

## Build Times

| Script | First Build | Incremental Build |
|--------|-------------|-------------------|
| build-mobile.bat | ~2-3 min | ~2-3 min (always clean) |
| build-and-install-mobile.bat | ~2-3 min + install | ~2-3 min + install |
| rebuild-mobile-quick.bat | ~2-3 min | ~30-60 sec |

## Output Files

All scripts create the APK at:
```
frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

**File size**: ~4.1 MB

## Manual Commands

If you prefer manual control:

```cmd
# Build frontend
cd frontend
npm run build

# Sync to Android
npx cap sync android

# Build APK
cd android
gradlew.bat assembleDebug
cd ..\..

# Install APK
adb install frontend\android\app\build\outputs\apk\debug\app-debug.apk

# Launch app
adb shell am start -n com.cal3.calendar/.MainActivity
```

## Advanced Options

### Clean Build
For a completely fresh build:
```cmd
cd frontend\android
gradlew.bat clean
gradlew.bat assembleDebug
```

### Release Build
For production APK (requires signing key):
```cmd
cd frontend\android
gradlew.bat assembleRelease
```

### View Logs
Monitor app logs while running:
```cmd
adb logcat | findstr cal3
```

## Related Documentation

- **Mobile App Guide**: `docs/MOBILE_APP.md`
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Build Guide**: `frontend/android/BUILD_GUIDE.md` (if exists)

---

**Last Updated**: October 24, 2025
**Version**: 1.1.5
