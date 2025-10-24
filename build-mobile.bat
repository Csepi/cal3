@echo off
REM Cal3 Mobile App Build Script
REM This script builds the Android APK from the React frontend

echo ========================================
echo Cal3 Mobile App Builder
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
echo Frontend build completed!
echo.

REM Step 2: Sync Capacitor
echo [2/3] Syncing Capacitor to Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo Capacitor sync completed!
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
echo Android APK build completed!
echo.

REM Display results
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo APK Location:
echo   frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo.

REM Show APK file size
for %%A in ("frontend\android\app\build\outputs\apk\debug\app-debug.apk") do (
    echo APK Size: %%~zA bytes
)
echo.

echo You can now install the APK using:
echo   adb install frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
