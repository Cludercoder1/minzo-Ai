<#
start-dev.ps1 (simplified and robust)
Opens a set of dev processes for local development on Windows.
This script: ensures .env files exist; runs npm installs if node_modules is missing;
starts backend, frontend; optionally starts python image service and ngrok tunnels.

Usage:
  .\start-dev.ps1                  # default: runs backend and frontend + python image svc if available
  .\start-dev.ps1 -NoPython        # skip starting the python image svc
  .\start-dev.ps1 -Ngrok           # also start ngrok tunnels for frontend/backend/python

#>

param (
    [switch]$NoPython,
    [switch]$Ngrok
)

Set-StrictMode -Version Latest
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "Repo root: $RepoRoot"

function CmdExists($cmd) {
    return (Get-Command $cmd -ErrorAction SilentlyContinue) -ne $null
}

if (-not (CmdExists node)) { Write-Warning 'Node not found. Please install Node.js and ensure it is on PATH' }
if (-not (CmdExists npm)) { Write-Warning 'npm not found. Please install npm' }
if (-not $NoPython -and -not (CmdExists python)) { Write-Warning 'python not found. Install Python 3 and add it to PATH' }
if ($Ngrok -and -not (CmdExists ngrok)) { Write-Warning 'ngrok not found. Add ngrok to PATH for tunnel support, or install it' }

# create .env files if missing
$backendEnv = Join-Path $RepoRoot 'backend\.env'
$backendEnvTemplate = Join-Path $RepoRoot 'backend\.env.template'
if (-not (Test-Path $backendEnv)) {
    if (Test-Path $backendEnvTemplate) { Copy-Item $backendEnvTemplate $backendEnv; Write-Host 'Created backend/.env from template' }
    else {
        @(
            'MINZO_API_KEY=',
            'JWT_SECRET=minzo_dev_secret_change_me',
            'SESSION_SECRET=minzo_session_secret',
            'PYTHON_IMAGE_SERVICE_URL=http://localhost:5001/generate',
            'PORT=3001',
            'FRONTEND_URL=http://localhost:3000'
        ) -join "`n" | Out-File -FilePath $backendEnv -Encoding UTF8 -Force
        Write-Host 'Created backend/.env with safe defaults — please edit before production.'
    }
}

$clientEnv = Join-Path $RepoRoot 'client\.env'
$clientEnvTemplate = Join-Path $RepoRoot 'client\.env.template'
if (-not (Test-Path $clientEnv)) {
    if (Test-Path $clientEnvTemplate) { Copy-Item $clientEnvTemplate $clientEnv; Write-Host 'Created client/.env from template' }
    else { 'REACT_APP_BACKEND_URL=http://localhost:3001' | Out-File -FilePath $clientEnv -Encoding UTF8 -Force; Write-Host 'Created client/.env' }
}

function Start-InWindow([string]$Title, [string]$Cmd, [string]$Dir) {
    Write-Host "Starting ${Title}: ${Cmd} (cwd: ${Dir})"
    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit','-NoProfile','-Command',$Cmd -WorkingDirectory $Dir
}

# Install dependencies only if node_modules is missing
if (-not (Test-Path (Join-Path $RepoRoot 'backend\node_modules'))) {
    Write-Host 'Installing backend dependencies...'
    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit','-NoProfile','-Command','npm install' -WorkingDirectory (Join-Path $RepoRoot 'backend')
    Start-Sleep -Seconds 4
}
if (-not (Test-Path (Join-Path $RepoRoot 'client\node_modules'))) {
    Write-Host 'Installing client dependencies...'
    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit','-NoProfile','-Command','npm install' -WorkingDirectory (Join-Path $RepoRoot 'client')
    Start-Sleep -Seconds 4
}

# Start the backend & frontend
Start-InWindow 'Backend' 'npm start' (Join-Path $RepoRoot 'backend')
Start-InWindow 'Frontend' 'npm start' (Join-Path $RepoRoot 'client')

if (-not $NoPython) {
    $pyPath = Join-Path $RepoRoot 'backend\python_image_service'
    if (Test-Path $pyPath) {
        # create venv & install deps then run uvicorn
        $vcmd = "if (-not (Test-Path '.venv')) { python -m venv .venv }; . .\.venv\Scripts\Activate.ps1; python -m pip install --upgrade pip; python -m pip install -r requirements.txt; python -m uvicorn main:app --host 0.0.0.0 --port 5001"
        Start-InWindow 'Python Image Service' $vcmd $pyPath
    } else { Write-Host 'No python image service found; skipping.' }
}

if ($Ngrok) {
    if (-not (CmdExists ngrok)) { Write-Warning 'ngrok not found; not starting tunnels' }
    else {
        Start-InWindow 'ngrok: frontend' 'ngrok http 3000' $RepoRoot
        Start-InWindow 'ngrok: backend' 'ngrok http 3001' $RepoRoot
        if (-not $NoPython) { Start-InWindow 'ngrok: python' 'ngrok http 5001' $RepoRoot }
    }
}

Write-Host 'Done. Windows should have been opened for logs. Use the windows to review logs.' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:3000 (or the ngrok URL for frontend if using tunnels)'
