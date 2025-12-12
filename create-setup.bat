@echo off
echo ========================================
echo MinzoFoundation AI Setup Script
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

echo Node.js is installed!
echo.

echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available!
    echo Please check your Node.js installation.
    pause
    exit /b 1
)

echo npm is available!
echo.

echo Setting up MinzoFoundation AI...
echo.

:: Create backend .env file
echo Creating backend environment file...
(
echo MINZO_API_KEY=sk-78724be718674e74a6beedae15b7b9e4
echo MINZO_BASE_URL=https://api.deepseek.com/v1
echo PORT=3001
echo NODE_ENV=development
echo RATE_LIMIT_WINDOW_MS=60000
echo RATE_LIMIT_MAX=100
echo JWT_SECRET=minzo_foundation_secure_jwt_secret_2024
) > backend\.env

echo Backend environment file created!
echo.

echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing frontend dependencies...
cd client
call npm install
cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo 1. Backend: cd backend && npm run dev
echo 2. Frontend: cd client && npm start
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.
pause