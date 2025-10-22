# Cal3 Mobile - Quick Start Guide

Get the Cal3 Android app running! Follow these detailed steps for first-time setup.

---

## Prerequisites Installation

### Step 1: Install Node.js (if not installed)

1. Download Node.js 18+ from https://nodejs.org/
2. Run installer with default settings
3. Verify installation:
   ```bash
   node --version    # Should show v18.x or higher
   npm --version     # Should show 9.x or higher
   ```

### Step 2: Install JDK (if not installed)

1. Download JDK 17 from https://www.oracle.com/java/technologies/downloads/#java17
   - OR use OpenJDK: https://adoptium.net/
2. Install with default settings
3. Verify installation:
   ```bash
   java -version     # Should show version 17.x
   ```

### Step 3: Install Android Studio

1. **Download Android Studio** from https://developer.android.com/studio
2. **Run the installer** and choose "Standard" installation
3. **During installation**, make sure these are checked:
   - ✅ Android SDK
   - ✅ Android SDK Platform
   - ✅ Android Virtual Device (AVD)
   - ✅ Performance (Intel HAXM or Hyper-V on Windows)

4. **Complete the setup wizard** - it will download required components (~2-3 GB)

### Step 4: Configure Android SDK (First Time Only)

1. **Open Android Studio**
2. Click **"More Actions"** → **"SDK Manager"**
   - If you have a project open: **Tools** → **SDK Manager**

3. **In "SDK Platforms" tab:**
   - ✅ Check **Android 14.0 (API 34)** - Required for building
   - ✅ Check **Android 8.0 (API 26)** - Minimum supported version
   - Click **"Apply"** to download

4. **In "SDK Tools" tab:**
   - ✅ Check **Android SDK Build-Tools 34.0.0**
   - ✅ Check **Android SDK Platform-Tools**
   - ✅ Check **Android Emulator**
   - ✅ Check **Intel x86 Emulator Accelerator (HAXM)** (Windows/Mac Intel)
   - Click **"Apply"** to download

5. **Note the SDK Location** (you'll need it later):
   - Usually: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk` (Windows)

---

## Creating Your First Android Emulator

### Option A: Using Android Studio (Recommended)

1. **Open Android Studio**

2. **Open Device Manager:**
   - Click **"More Actions"** → **"Virtual Device Manager"**
   - OR from top menu: **Tools** → **Device Manager**
   - OR press **Ctrl+Shift+A** and search "Device Manager"

3. **Create a new virtual device:**
   - Click **"Create Device"** button (or the **+** icon)

4. **Select Hardware:**
   - Category: **Phone**
   - Choose: **Pixel 5** or **Pixel 4** (recommended)
   - Click **"Next"**

5. **Select System Image:**
   - Click **"Recommended"** tab
   - Choose: **Android 13.0 (API 33)** or **Android 14.0 (API 34)**
   - If you see "Download" next to it, click to download first (~1-2 GB)
   - After download, select it and click **"Next"**

6. **Configure AVD:**
   - AVD Name: **Pixel_5_API_33** (or similar)
   - Startup orientation: **Portrait**
   - Click **"Show Advanced Settings"** (optional):
     - RAM: 2048 MB (minimum, 4096 MB if you have RAM available)
     - Internal Storage: 2048 MB
     - SD Card: 512 MB (optional)
   - Click **"Finish"**

7. **Your emulator is created!** You'll see it in the Device Manager list.

### Starting the Emulator

**From Device Manager:**
1. Find your device in the list
2. Click the **▶ (Play)** button in the "Actions" column
3. Wait 30-60 seconds for the emulator to boot
4. You'll see the Android home screen when ready

**Alternative - From Command Line:**
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_5_API_33
```

### Troubleshooting Emulator Issues

**"Device Manager" not visible?**
- Go to **Tools** → **Device Manager**
- OR use **View** → **Tool Windows** → **Device Manager**

**Emulator is very slow?**
- Make sure HAXM/Hyper-V is installed and enabled
- Increase emulator RAM in AVD settings
- Close other heavy applications

**"HAXM is not installed"?**
- Windows with Intel: Install from SDK Manager → SDK Tools → Intel HAXM
- Windows with AMD: Use Windows Hypervisor Platform (Settings → Windows Features)
- Restart computer after installation

---

## First-Time Project Setup

### 1. Configure Android SDK Location

Create `android/local.properties` file in the phone directory:

**Windows:**
```properties
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

**macOS:**
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

**Linux:**
```properties
sdk.dir=/home/YOUR_USERNAME/Android/Sdk
```

> **How to find your SDK location:**
> Android Studio → SDK Manager → Look at "Android SDK Location" at the top

### 2. Install Node Dependencies

```bash
cd phone
npm install
```

**Expected time**: 3-5 minutes for first install
**Expected output**: Hundreds of packages installed without errors

**If you see errors:**
- Make sure you're in the `phone` directory
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### 3. Start Backend Server (Required)

The mobile app needs the backend API running. Open a **new terminal** window:

```bash
# Navigate to backend directory (from repository root)
cd backend-nestjs

# Start the backend server
PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev
```

**Expected output:**
```
[Nest] 12345  - 10/21/2025, 2:30:45 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 10/21/2025, 2:30:45 PM     LOG [InstanceLoader] AppModule dependencies initialized
...
[Nest] 12345  - 10/21/2025, 2:30:46 PM     LOG Application is running on: http://localhost:8081
```

**✅ Success:** You should see "Application is running on: http://localhost:8081"

**Keep this terminal running!** Don't close it.

### 4. Start the Android Emulator

**Before running the app, make sure your emulator is running:**

1. Open **Android Studio**
2. Open **Device Manager** (Tools → Device Manager)
3. Click **▶ Play** button next to your emulator
4. **Wait for Android to fully boot** (you'll see the home screen)

**Verify emulator is running:**
```bash
adb devices
```

**Expected output:**
```
List of devices attached
emulator-5554   device
```

**✅ Success:** You see your emulator listed as "device" (not "offline")

### 5. Run the App (First Build)

Now with backend running and emulator started:

```bash
# From phone/ directory
npm run android
```

**What happens:**
1. Metro bundler starts (JavaScript packager)
2. Gradle builds the Android app (**5-10 minutes first time!**)
3. App installs on emulator
4. App launches automatically

**First build is SLOW** because Gradle downloads dependencies. Subsequent builds are much faster (30-60 seconds).

**Expected final output:**
```
info Successfully installed the app
info Launching the app...
```

**✅ Success:** The Cal3 app opens on your emulator showing:
- "Cal3 Mobile" title
- "Android Calendar & Reservation App" subtitle
- Version 0.1.0 - Phase 1
- Platform information

---

## What You'll See

The app will launch showing:
- **Cal3 Mobile** title
- **Android Calendar & Reservation App** subtitle
- Version 0.1.0 - Phase 1
- Your Android platform version

This is the Phase 1 placeholder. Actual features will be added in Phase 2+.

---

## Common Issues & Solutions

### Issue: "SDK location not found"

**Solution:** Create `phone/android/local.properties` file:

**Windows:**
```properties
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

**macOS:**
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

**Linux:**
```properties
sdk.dir=/home/YOUR_USERNAME/Android/Sdk
```

Replace `YOUR_USERNAME` with your actual username.

---

### Issue: "No devices/emulators found"

**Check if emulator is running:**
```bash
adb devices
```

**If list is empty:**
1. Open Android Studio → Device Manager
2. Start your emulator (click ▶ play button)
3. Wait for Android to fully boot
4. Run `adb devices` again - should show `emulator-5554   device`

**If emulator doesn't start:**
- Check HAXM/Hyper-V is installed
- Try creating a new emulator with lower specifications
- Restart Android Studio

---

### Issue: "Unable to connect to development server"

**Solution:**

1. **Check Metro bundler is running:**
   ```bash
   npm start
   ```
   Should show: "Metro waiting on port 8081"

2. **Check backend is running:**
   ```bash
   cd backend-nestjs
   PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev
   ```
   Should show: "Application is running on: http://localhost:8081"

3. **For Android emulator**, API URL should be `http://10.0.2.2:8081` (special address for host machine)

4. **For physical device**, update `src/constants/config.ts`:
   ```typescript
   BASE_URL: 'http://192.168.1.XXX:8081'  // Your computer's IP
   ```

   Find your IP:
   - Windows: `ipconfig` (look for IPv4 Address)
   - macOS/Linux: `ifconfig` (look for inet)

---

### Issue: "Command failed: gradlew.bat" or build errors

**Solution 1 - Clean build:**
```bash
cd android
gradlew clean  # Windows
./gradlew clean  # macOS/Linux
cd ..
npm run android
```

**Solution 2 - Rebuild dependencies:**
```bash
cd android
gradlew clean build  # Windows
./gradlew clean build  # macOS/Linux
```

**Solution 3 - Clear caches:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json
npm install

# Clear Android build
cd android
gradlew clean
```

---

### Issue: Metro bundler cache issues / App shows old code

**Solution:**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Or manually
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
```

---

### Issue: "Execution failed for task ':app:installDebug'"

**Solution:**

1. **Check emulator is running:**
   ```bash
   adb devices
   ```

2. **Restart ADB:**
   ```bash
   adb kill-server
   adb start-server
   ```

3. **Uninstall old version:**
   ```bash
   adb uninstall com.cal3mobile
   npm run android
   ```

---

### Issue: First build is taking forever (>15 minutes)

**This is normal!** First Gradle build downloads ~500MB of dependencies.

**To monitor progress:**
```bash
cd android
gradlew assembleDebug --info  # Shows detailed progress
```

**Subsequent builds are much faster** (30-60 seconds).

---

### Issue: Emulator is very slow

**Solutions:**

1. **Increase RAM:**
   - Device Manager → ⋮ (3 dots) → Edit
   - Advanced Settings → RAM: 4096 MB

2. **Enable hardware acceleration:**
   - Windows (Intel): SDK Manager → SDK Tools → Intel HAXM
   - Windows (AMD): Windows Features → Hyper-V / Windows Hypervisor Platform
   - macOS: Should be enabled by default

3. **Use a lighter device:**
   - Create new AVD with Pixel 4 instead of Pixel 5
   - Use API 30 instead of API 33/34

4. **Close other applications** to free up RAM

---

### Issue: "INSTALL_FAILED_INSUFFICIENT_STORAGE"

**Solution:**

1. **Increase emulator storage:**
   - Device Manager → ⋮ (3 dots) → Edit
   - Advanced Settings → Internal Storage: 4096 MB

2. **Clear emulator data:**
   - Device Manager → ⋮ (3 dots) → Wipe Data

---

### Issue: Physical device not detected

**Solution:**

1. **Enable USB Debugging on device:**
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable USB Debugging

2. **Check USB connection:**
   ```bash
   adb devices
   ```
   Should show your device.

3. **If "unauthorized":**
   - Check your phone for USB debugging authorization prompt
   - Check "Always allow from this computer"
   - Tap "OK"

4. **Try different USB cable** - some cables are charge-only

---

### Still Having Issues?

1. **Check the logs:**
   ```bash
   # Metro bundler logs
   npm start

   # Android logs
   adb logcat

   # Gradle logs
   cd android && gradlew assembleDebug --stacktrace
   ```

2. **See detailed documentation:**
   - [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Development guide
   - [docs/](docs/) - All documentation

3. **React Native troubleshooting:**
   - https://reactnative.dev/docs/troubleshooting

---

## Development Workflow

### Terminal Setup

**Terminal 1** - Backend:
```bash
cd backend-nestjs
PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev
```

**Terminal 2** - Metro Bundler:
```bash
cd phone
npm start
```

**Terminal 3** - Run Android:
```bash
cd phone
npm run android
```

### Hot Reload

Changes to `.tsx` and `.ts` files reload automatically!

### Reload Manually

- Shake device OR
- Press `R` twice in Metro bundler terminal

### Open Dev Menu

- Shake device OR
- Run: `adb shell input keyevent 82`

---

## Project Structure

```
phone/
├── src/
│   ├── components/      # UI components
│   ├── screens/         # Screen components
│   ├── navigation/      # Navigation config
│   ├── api/             # API integration
│   ├── hooks/           # Custom hooks
│   ├── types/           # TypeScript types
│   ├── constants/       # Configuration
│   └── App.tsx          # Main component
├── android/             # Android native code
├── docs/                # Documentation
├── package.json
└── README.md
```

---

## Next Steps

### Phase 2: Core Infrastructure (Weeks 3-4)

1. API client implementation
2. Authentication system
3. State management setup
4. Login/Register screens

See [MOBILE_APP_PLAN.md](../MOBILE_APP_PLAN.md) for complete roadmap.

---

## Useful Commands

```bash
# Run app
npm run android

# Run on specific device
npm run android -- --deviceId=emulator-5554

# Start Metro bundler
npm start

# Clear Metro cache
npm start -- --reset-cache

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Format code
npm run format

# Clean Android build
cd android && ./gradlew clean && cd ..
```

---

## Getting Help

- **Documentation**: See `docs/` folder
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Development**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- **API Integration**: [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md)

---

**Happy Coding! 🚀**
