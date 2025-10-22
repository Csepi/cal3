# Port Configuration for Cal3 Mobile Development

## Overview
The Cal3 Mobile app requires two services running simultaneously during development:

1. **Cal3 Backend API** (NestJS)
2. **Metro Bundler** (React Native)

## Port Assignments

| Service | Port | Purpose |
|---------|------|---------|
| **Backend API** | 8081 | NestJS server for calendar data, authentication, reservations |
| **Metro Bundler** | 8082 | React Native development server for hot reloading |

## Why Separate Ports?

Both services need to run at the same time:
- The **backend** provides the API endpoints for the mobile app
- The **Metro bundler** serves the JavaScript bundle to the mobile app

Using different ports prevents conflicts and allows both to run simultaneously.

## Starting Development Environment

### Option 1: Automated Startup (Recommended)
Run the provided batch script:
```cmd
start-dev.bat
```

This will open two separate command windows:
- One for the Backend API (port 8081)
- One for Metro Bundler (port 8082)

### Option 2: Manual Startup

**Terminal 1 - Start Backend:**
```cmd
cd c:\Users\ThinkPad\cal3\backend-nestjs
PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev
```

**Terminal 2 - Start Metro Bundler:**
```cmd
cd c:\Users\ThinkPad\cal3\phone
npm start
```

**Terminal 3 - Build and Install App:**
```cmd
cd c:\Users\ThinkPad\cal3\phone
npm run android
```

## Connecting Mobile App to Backend

When the mobile app needs to connect to the backend API, it should use:

```
http://10.0.2.2:8081/api
```

**Why 10.0.2.2?**
- Android emulator maps `10.0.2.2` to `localhost` on your development machine
- This allows the emulator to reach services running on your computer

For physical devices on the same network, use your computer's actual IP address:
```
http://192.168.1.XXX:8081/api
```

## Configuration Files

- **Metro Port**: Configured in `metro.config.js` → `server.port: 8082`
- **Backend Port**: Set via `PORT` environment variable → `PORT=8081`
- **Package Scripts**: Updated in `package.json` → `--port 8082` flag

## Troubleshooting

### Port Already in Use

If you see "EADDRINUSE" error:

1. **Find the process using the port:**
```cmd
netstat -ano | findstr :8081
netstat -ano | findstr :8082
```

2. **Kill the process by PID** (from rightmost column):
```cmd
taskkill /f /pid <PID_NUMBER>
```

### Cannot Connect to Backend from App

1. Verify backend is running: Open `http://localhost:8081/api` in your browser
2. Verify Metro is running: Open `http://localhost:8082/status` in your browser
3. Check Android emulator can reach backend: Use `10.0.2.2:8081` instead of `localhost:8081`

## Notes

- Metro bundler automatically reloads when you save code changes
- Backend auto-restarts on code changes (via `start:dev`)
- Both services must be running for the mobile app to work properly
