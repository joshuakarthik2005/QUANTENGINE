# QuantEngine - Package for Chrome Web Store
# This script creates a ZIP file ready for Chrome Web Store upload

$distPath = ".\dist"
$outputZip = ".\quantengine-v1.0.0.zip"

# Check if dist folder exists
if (-Not (Test-Path $distPath)) {
    Write-Host "Error: dist folder not found. Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Remove old ZIP if exists
if (Test-Path $outputZip) {
    Remove-Item $outputZip
    Write-Host "Removed old ZIP file" -ForegroundColor Yellow
}

# Create ZIP from dist contents
Write-Host "Creating ZIP file for Chrome Web Store..." -ForegroundColor Cyan
Compress-Archive -Path "$distPath\*" -DestinationPath $outputZip

# Verify ZIP was created
if (Test-Path $outputZip) {
    $zipSize = (Get-Item $outputZip).Length / 1MB
    Write-Host "Successfully created: $outputZip" -ForegroundColor Green
    Write-Host "File size: $($zipSize.ToString('F2')) MB" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://chrome.google.com/webstore/devconsole" -ForegroundColor White
    Write-Host "2. Click 'New Item'" -ForegroundColor White
    Write-Host "3. Upload: $outputZip" -ForegroundColor White
    Write-Host "4. Fill out store listing details" -ForegroundColor White
    Write-Host "5. Submit for review" -ForegroundColor White
    Write-Host ""
    Write-Host "See PUBLISHING_GUIDE.md for detailed instructions" -ForegroundColor Yellow
} else {
    Write-Host "Error: Failed to create ZIP file" -ForegroundColor Red
    exit 1
}
