Write-Host "Killing git processes..."
taskkill /F /IM git.exe
Start-Sleep -Seconds 2

if (Test-Path .git/index.lock) {
    Write-Host "Removing index.lock..."
    Remove-Item -Force .git/index.lock
}

Write-Host "Removing frontend/node_modules from git index..."
git rm -r --cached frontend/node_modules

Write-Host "Committing changes..."
git commit -m "Fix permissions: Remove node_modules from git"

Write-Host "Pushing to remote..."
git push origin main

Write-Host "Done! Check Render dashboard."
