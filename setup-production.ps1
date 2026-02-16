#!/usr/bin/env powershell

# MinzoAI Production Setup Script (Windows PowerShell)

Write-Host "🚀 MinzoAI Production Deployment Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check if backend URL is provided
if ($args.Count -eq 0) {
    Write-Host "Usage: .\setup-production.ps1 <BACKEND_URL>" -ForegroundColor Yellow
    Write-Host "Example: .\setup-production.ps1 https://api.minzoai.com" -ForegroundColor Yellow
    exit 1
}

$BACKEND_URL = $args[0]
$CLIENT_INDEX = "client\public\index.html"

Write-Host ""
Write-Host "📝 Configuration:" -ForegroundColor Cyan
Write-Host "  Backend URL: $BACKEND_URL"
Write-Host "  Frontend File: $CLIENT_INDEX"
Write-Host ""

# Check if file exists
if (-not (Test-Path $CLIENT_INDEX)) {
    Write-Host "❌ Error: $CLIENT_INDEX not found" -ForegroundColor Red
    exit 1
}

# Backup original file
Copy-Item $CLIENT_INDEX "$CLIENT_INDEX.backup" -Force
Write-Host "✅ Created backup: $CLIENT_INDEX.backup" -ForegroundColor Green

# Read the file
$content = Get-Content $CLIENT_INDEX -Raw

# Update the meta tag with production backend URL
$content = $content -replace '<meta name="minzo-backend" content="[^"]*">', "<meta name=""minzo-backend"" content=""$BACKEND_URL"">"

# Write back
Set-Content $CLIENT_INDEX $content -Encoding UTF8

# Verify the change
if ($content -match [regex]::Escape($BACKEND_URL)) {
    Write-Host "✅ Backend URL updated successfully" -ForegroundColor Green
    Write-Host "   Meta tag now points to: $BACKEND_URL"
} else {
    Write-Host "⚠️  Could not verify update, please check manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test locally: cd client\public && npx http-server -p 3000"
Write-Host "2. Verify in browser: http://localhost:3000"
Write-Host "3. Check console: window.MINZO_BACKEND_URL should show: $BACKEND_URL"
Write-Host "4. Deploy to production hosting"
Write-Host ""
Write-Host "🔄 To rollback to development:" -ForegroundColor Yellow
Write-Host "   Copy-Item $CLIENT_INDEX.backup $CLIENT_INDEX -Force"
Write-Host ""
