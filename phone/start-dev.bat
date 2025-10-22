@echo off
echo.
echo ========================================
echo   Cal3 Mobile Development Environment
echo ========================================
echo.
echo Starting services:
echo   - Backend API: http://localhost:8081
echo   - Metro Bundler: http://localhost:8082
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start backend server in a new window
start "Cal3 Backend" cmd /k "cd /d c:\Users\ThinkPad\cal3\backend-nestjs && PORT=8081 JWT_SECRET=calendar-secret-key npm run start:dev"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

REM Start Metro bundler in a new window
start "Metro Bundler" cmd /k "cd /d c:\Users\ThinkPad\cal3\phone && npm start"

echo.
echo Services are starting in separate windows...
echo Close those windows to stop the services.
echo.
pause
