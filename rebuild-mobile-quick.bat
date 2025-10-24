@echo off
REM Cal3 Mobile App Quick Rebuild Script
REM This script does a quick rebuild without cleaning (faster for iterative development)

echo ========================================
echo Cal3 Mobile Quick Rebuild
echo ========================================
echo.

cd frontend
echo Building frontend...
call npm run build && call npx cap sync android && cd android && call gradlew.bat assembleDebug && cd ..\..

if %errorlevel% equ 0 (
    echo.
    echo ✓ Quick rebuild successful!
    echo APK: frontend\android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo.
    echo ✗ Build failed!
)

echo.
pause
