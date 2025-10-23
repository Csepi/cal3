# Cal3 Mobile - Android Build Guide

## Overview
This document outlines the production-ready Android build configuration for Cal3 Mobile, following industry best practices for React Native 0.76.9 applications.

---

## Build Configuration

### 1. **Gradle Version & Plugins**
- **Gradle**: 8.9
- **Android Gradle Plugin**: 8.7.3
- **Kotlin**: 1.9.22
- **Build Tools**: 34.0.0

### 2. **Android SDK Versions**
- **Compile SDK**: 34 (Android 14)
- **Target SDK**: 34 (Android 14)
- **Min SDK**: 26 (Android 8.0)
- **NDK**: 26.1.10909125

### 3. **Supported Architectures**
- **ARM**: armeabi-v7a, arm64-v8a (production)
- **x86**: x86, x86_64 (emulator support)

---

## Build Types

### Debug Build
```bash
cd android
.\gradlew.bat assembleDebug
```

**Features:**
- Debug symbols included
- No code obfuscation
- Application ID suffix: `.debug`
- Faster build times
- Debuggable in Android Studio

**Output:** `app/build/outputs/apk/debug/app-debug.apk`

### Release Build
```bash
cd android
.\gradlew.bat assembleRelease
```

**Features:**
- Code obfuscation via ProGuard
- Resource shrinking enabled
- Optimized APK size
- Production-ready

**Output:** `app/build/outputs/apk/release/app-release.apk`

---

## Performance Optimizations

### Gradle Performance
The following optimizations are enabled in `gradle.properties`:

1. **Memory Allocation**
   - JVM Heap: 4GB
   - Metaspace: 1GB
   - Heap dump on OOM enabled

2. **Build Features**
   - Parallel execution: ✅
   - Configuration cache: ✅
   - Build cache: ✅
   - Gradle daemon: ✅

3. **Expected Build Times**
   - Clean build: ~2-3 minutes
   - Incremental build: ~30-60 seconds

### Code Optimization
- **ProGuard**: Enabled for release builds
- **R8 Optimizer**: Used for code shrinking
- **MultiDex**: Enabled for 64K+ methods

---

## ProGuard Configuration

### What's Protected
- React Native core classes
- Native modules (AsyncStorage, Screens, etc.)
- Kotlin metadata
- AndroidX libraries
- Custom application classes

### What's Optimized
- Dead code elimination
- Method inlining
- Class merging
- Obfuscation of class/method names

**File:** `app/proguard-rules.pro`

---

## Native Modules (Autolinking)

The following React Native libraries are automatically linked:

1. **@react-native-async-storage/async-storage** - Local storage
2. **react-native-safe-area-context** - Safe area management
3. **react-native-screens** - Native navigation screens
4. **react-native-keychain** - Secure storage
5. **react-native-vector-icons** - Icon library

**Configuration:** Managed by React Native CLI autolinking

---

## Troubleshooting

### Build Fails with "Out of Memory"
Increase JVM memory in `gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=1g
```

### Clean Build
```bash
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

### Reset Gradle Daemon
```bash
cd android
.\gradlew.bat --stop
.\gradlew.bat assembleDebug
```

### Clear All Caches
```bash
cd android
rm -rf .gradle build app/build
cd ..
rm -rf node_modules
npm install
```

---

## Release Signing (Production)

### Step 1: Generate Release Keystore
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias cal3-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Step 2: Configure Signing
Uncomment release signing config in `app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS")
        keyPassword System.getenv("KEY_PASSWORD")
    }
}
```

### Step 3: Set Environment Variables
```bash
export KEYSTORE_PASSWORD="your-keystore-password"
export KEY_ALIAS="cal3-release"
export KEY_PASSWORD="your-key-password"
```

### Step 4: Build Signed APK
```bash
cd android
.\gradlew.bat assembleRelease
```

**⚠️ IMPORTANT:** Never commit `release.keystore` to version control!

---

## Bundle Size Optimization

### APK Splitting (Optional)
Enable per-ABI APKs in `app/build.gradle`:
```gradle
def enableSeparateBuildPerCPUArchitecture = true
```

This creates separate APKs for each architecture:
- `app-armeabi-v7a-release.apk` (~25MB)
- `app-arm64-v8a-release.apk` (~30MB)
- `app-x86-release.apk` (~28MB)
- `app-x86_64-release.apk` (~32MB)

### App Bundle (AAB) for Google Play
```bash
cd android
.\gradlew.bat bundleRelease
```

**Output:** `app/build/outputs/bundle/release/app-release.aab`

---

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Build Android APK
  run: |
    cd android
    ./gradlew assembleRelease

- name: Upload APK
  uses: actions/upload-artifact@v3
  with:
    name: app-release
    path: android/app/build/outputs/apk/release/app-release.apk
```

---

## File Structure
```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml      # App permissions & config
│   │       ├── java/com/cal3mobile/
│   │       │   ├── MainActivity.kt       # Main entry point
│   │       │   └── MainApplication.kt    # App initialization
│   │       └── res/                      # Resources (icons, strings)
│   ├── build.gradle                      # App-level build config
│   ├── proguard-rules.pro               # Code obfuscation rules
│   └── debug.keystore                    # Debug signing key
├── build.gradle                          # Project-level build config
├── settings.gradle                       # Project settings
├── gradle.properties                     # Build properties
└── BUILD_GUIDE.md                        # This file
```

---

## Best Practices

✅ **DO:**
- Use release builds for production
- Enable ProGuard for code protection
- Test on multiple device types
- Monitor APK size regularly
- Keep dependencies updated

❌ **DON'T:**
- Commit keystores to version control
- Use debug builds in production
- Ignore ProGuard warnings
- Skip testing on real devices
- Hardcode sensitive data

---

## Support & Resources

- **React Native Docs**: https://reactnative.dev/docs/signed-apk-android
- **Gradle Docs**: https://docs.gradle.org/
- **Android Docs**: https://developer.android.com/studio/build

---

**Last Updated:** 2025-01-22
**Maintained By:** Cal3 Development Team
