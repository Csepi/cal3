@echo off
echo ====================================
echo Cal3 Mobile - Build and Run Script
echo ====================================
echo.

REM Set Java Home
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
echo Setting JAVA_HOME to: %JAVA_HOME%

REM Add Android SDK tools to PATH
set "PATH=%PATH%;C:\Users\ThinkPad\AppData\Local\Android\Sdk\platform-tools"
echo Adding Android SDK platform-tools to PATH

echo.
echo Step 1: Building Android App (this will take 5-10 minutes on first build)...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build failed! Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ Build successful!
echo.
echo Step 2: Installing app on emulator...
call gradlew.bat installDebug
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Installation failed! Make sure your emulator is running.
    pause
    exit /b 1
)

cd ..

echo.
echo Step 3: Starting Metro bundler...
start cmd /k npm start

echo.
echo ✅ All done! The app should now be running on your emulator.
echo.
echo Press any key to exit...
pause > nul
