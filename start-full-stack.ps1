Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MinzoAI Full Stack Server Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing node processes
Write-Host "Cleaning up..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 1

# Start Backend
Write-Host "Starting Backend Server (Port 3001)..." -ForegroundColor Green
$BackendPath = "c:\Users\Work&Study\Desktop\MinzoAI\backend"
Set-Location $BackendPath
$BackendJob = Start-Job -ScriptBlock { node server.js }
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server (Port 3000)..." -ForegroundColor Green
$FrontendPath = "c:\Users\Work&Study\Desktop\MinzoAI\client\public"
Set-Location $FrontendPath
$FrontendJob = Start-Job -ScriptBlock { node server.js }
Start-Sleep -Seconds 2

# Test connections
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Servers..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

try {
    $test1 = curl -s http://localhost:3001/api/health
    Write-Host "✅ Backend API:  RESPONDING" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend API:  NOT RESPONDING" -ForegroundColor Red
}

Start-Sleep -Seconds 1

try {
    $test2 = curl -s http://localhost:3000
    Write-Host "✅ Frontend Web: RESPONDING" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend Web: NOT RESPONDING" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📍 URLs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend:   http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "Both servers are now running!" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop..."
Write-Host ""

# Keep servers running
Get-Job | Wait-Job
