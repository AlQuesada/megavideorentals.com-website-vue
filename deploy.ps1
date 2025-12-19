# Deploy script for Hostinger
# Builds the project and pushes only public_html/ to the deploy branch

$ErrorActionPreference = "Stop"

Write-Host "Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Preparing deploy branch..." -ForegroundColor Cyan

# Store current branch
$currentBranch = git rev-parse --abbrev-ref HEAD

# Create a temp directory for deployment
$tempDir = Join-Path $env:TEMP "deploy-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # Copy built files to temp directory
    Copy-Item -Path "public_html\*" -Destination $tempDir -Recurse -Force
    
    # Initialize git in temp directory
    Push-Location $tempDir
    git init
    git checkout -b deploy
    git add -A
    git commit -m "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    
    # Get the remote URL from the main repo
    Pop-Location
    $remoteUrl = git remote get-url origin
    
    # Push from temp directory
    Push-Location $tempDir
    git remote add origin $remoteUrl
    git push origin deploy --force
    
    Write-Host "Deployed to Hostinger!" -ForegroundColor Green
    Write-Host "Hostinger will auto-pull the deploy branch." -ForegroundColor Gray
}
catch {
    Write-Host "Deploy failed: $_" -ForegroundColor Red
    exit 1
}
finally {
    # Cleanup
    Pop-Location
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
