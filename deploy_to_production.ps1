# Deploy Backend to Production Server
# This script pulls latest changes and restarts the backend on the production server

param(
    [string]$ServerIP = "198.244.241.220",
    [string]$ServerUser = "root",
    [string]$AppPath = "/var/www/supplymecorp_Backend"
)

Write-Host "🚀 Deploying Backend to Production Server..." -ForegroundColor Cyan
Write-Host "Server: $ServerUser@$ServerIP" -ForegroundColor Yellow
Write-Host "Path: $AppPath" -ForegroundColor Yellow
Write-Host ""

# SSH command to execute on the server
$deployCommands = @"
set -e
cd $AppPath

echo '📥 Pulling latest changes from Git...'
git pull origin main

echo '📦 Installing dependencies...'
npm install

echo '🔨 Building application...'
npm run build

echo '♻️  Restarting backend with PM2...'
pm2 restart supplyme-backend || pm2 start dist/src/main.js --name supplyme-backend

echo '✅ Deployment complete!'
pm2 status
"@

# Execute deployment via SSH
Write-Host "Connecting to server..." -ForegroundColor Cyan
ssh $ServerUser@$ServerIP $deployCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "Backend is now running with the latest changes." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    exit 1
}
