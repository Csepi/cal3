@echo off
REM Cal3 Mobile App Log Viewer
REM This script shows real-time logs from the Cal3 app running on Android

echo ========================================
echo Cal3 Mobile App Log Viewer
echo ========================================
echo.

REM Check if device is connected
adb devices | findstr "device" | findstr /v "List" > nul
if %errorlevel% neq 0 (
    echo ERROR: No Android devices connected!
    echo.
    echo Please connect a device or start an emulator, then try again.
    echo.
    pause
    exit /b 1
)

echo Connected devices:
adb devices
echo.

echo Showing Cal3 app logs (Press Ctrl+C to stop)...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Show real-time filtered logs
adb logcat | findstr /I "cal3 calendar"
