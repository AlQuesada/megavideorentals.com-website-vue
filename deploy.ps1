# Deploy script for Hostinger
# Builds the project and pushes only public_html/ to the deploy branch

Write-Host "🔨 Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Pushing public_html to deploy branch..." -ForegroundColor Cyan

# Create a temporary branch from the subtree
git subtree split --prefix public_html -b deploy-temp

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Subtree split failed!" -ForegroundColor Red
    exit 1
}

# Force push to the deploy branch on origin
git push origin deploy-temp:deploy --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    git branch -D deploy-temp
    exit 1
}

# Clean up the temporary branch
git branch -D deploy-temp

Write-Host "✅ Deployed to Hostinger!" -ForegroundColor Green
Write-Host "Hostinger will auto-pull the deploy branch." -ForegroundColor Gray

