@echo off
echo ========================================
echo MinzoAI Full Stack Startup
echo ========================================

REM Kill any existing node processes
taskkill /F /IM node.exe >nul 2>&1

echo.
echo Starting Backend Server (Port 3001)...
cd /d "c:\Users\Work&Study\Desktop\MinzoAI\backend"
start "MinzoAI Backend" node server.js

timeout /t 3 /nobreak

echo.
echo Starting Frontend Server (Port 3000)...
cd /d "c:\Users\Work&Study\Desktop\MinzoAI\client\public"
start "MinzoAI Frontend" http-server -p 3000 -c-1

timeout /t 2 /nobreak

echo.
echo ========================================
echo ✅ Both servers started!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo Press any key to exit this window...
pause
