@echo off
REM ===========================================
REM Cal3 Local Deployment Script (Windows)
REM ===========================================
REM This script deploys Cal3 using local image builds
REM Use this when you don't have access to ghcr.io

setlocal enabledelayedexpansion

echo.
echo ========================================
echo      Cal3 Local Deployment
echo ========================================
echo.

cd /d "%~dp0"

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo.
    if exist ".env.example" (
        echo Creating .env from example...
        copy .env.example .env >nul
        echo.
        echo .env created. Please edit it with your values:
        echo   - DB_USERNAME
        echo   - DB_PASSWORD
        echo   - JWT_SECRET (32+ characters)
        echo.
        pause
    ) else (
        echo ERROR: .env.example not found. Cannot proceed.
        pause
        exit /b 1
    )
)

echo.
echo Select deployment mode:
echo   1) Production (docker-compose.yml - local build)
echo   2) Portainer-compatible (docker-compose.portainer-local.yml)
echo   3) Development (docker-compose.dev.yml - hot reload)
echo.
set /p choice="Enter choice [1-3]: "

if "%choice%"=="1" (
    set COMPOSE_FILE=docker-compose.yml
    set MODE=Production
) else if "%choice%"=="2" (
    set COMPOSE_FILE=docker-compose.portainer-local.yml
    set MODE=Portainer (Local Build^)
) else if "%choice%"=="3" (
    set COMPOSE_FILE=docker-compose.dev.yml
    set MODE=Development
) else (
    echo ERROR: Invalid choice
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deploying Cal3 in %MODE% mode...
echo Using: %COMPOSE_FILE%
echo ========================================
echo.

REM Stop existing containers
echo Stopping existing containers...
docker-compose -f %COMPOSE_FILE% down 2>nul

REM Build images
echo.
echo Building images (this may take a few minutes)...
docker-compose -f %COMPOSE_FILE% build
if errorlevel 1 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

REM Start containers
echo.
echo Starting containers...
docker-compose -f %COMPOSE_FILE% up -d
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start containers!
    pause
    exit /b 1
)

REM Wait for services
echo.
echo Waiting for services to start...
timeout /t 5 /nobreak >nul

REM Check status
echo.
echo ========================================
echo Container status:
echo ========================================
docker-compose -f %COMPOSE_FILE% ps

echo.
echo ========================================
echo Deployment complete!
echo ========================================
echo.
echo Access Cal3:
echo   Frontend: http://localhost:8080
echo   Backend:  http://localhost:8081
echo   Database: localhost:5432
echo.
echo Useful commands:
echo   View logs:   docker-compose -f %COMPOSE_FILE% logs -f
echo   Stop:        docker-compose -f %COMPOSE_FILE% down
echo   Restart:     docker-compose -f %COMPOSE_FILE% restart
echo   Rebuild:     docker-compose -f %COMPOSE_FILE% up -d --build
echo.
pause
