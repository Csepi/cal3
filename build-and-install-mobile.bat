@echo off
REM PrimeCal Mobile App Build and Install Script
REM This script builds the Android APK and optionally installs it on a connected device

REM Add Node.js to PATH
set "PATH=C:\Program Files\nodejs;%PATH%"
set "CAPACITOR_SERVER_URL=https://app.primecal.eu"

echo ========================================
echo PrimeCal Mobile App Builder ^& Installer
echo ========================================
echo.

REM Step 1: Build Frontend
echo [1/3] Building frontend with Vite...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo + Frontend build completed!
echo.

REM Step 2: Sync Capacitor
echo [2/3] Syncing Capacitor to Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo + Capacitor sync completed!
echo.

REM Step 3: Build Android APK
echo [3/3] Building Android APK...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo ERROR: Android build failed!
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo + Android APK build completed!
echo.

REM Display results
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo APK Location:
echo   frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo.

REM Check if device is connected
echo Checking for connected Android devices...
adb devices | findstr "device" | findstr /v "List" > nul
if %errorlevel% equ 0 (
    echo.
    echo Connected devices:
    adb devices
    echo.
    choice /C YN /M "Do you want to install the APK now"
    if errorlevel 2 goto :skip_install
    if errorlevel 1 goto :install
) else (
    echo No Android devices connected.
    goto :skip_install
)

:install
echo.
echo Installing APK...
adb install -r frontend\android\app\build\outputs\apk\debug\app-debug.apk
if %errorlevel% neq 0 (
    echo ERROR: Installation failed!
    pause
    exit /b 1
)
echo + APK installed successfully!
echo.
choice /C YN /M "Do you want to launch the app now"
if errorlevel 2 goto :end
if errorlevel 1 goto :launch

:launch
echo.
echo Launching PrimeCal Calendar...
adb shell am start -n com.primecal.calendar/.MainActivity
echo + App launched!
goto :end

:skip_install
echo.
echo To install manually, run:
echo   adb install frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo.

:end
echo.
echo ========================================
echo Done!
echo ========================================
pause
