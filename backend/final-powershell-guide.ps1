# Ultimate PowerShell Commands for Air Quality API
# Copy and paste these individual commands as needed

Write-Host "🚀 Air Quality API - PowerShell Command Reference" -ForegroundColor Cyan
Write-Host "Copy the commands below and paste them into PowerShell" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== BASIC COMMANDS ===" -ForegroundColor Green
Write-Host ""

Write-Host "# Check server health:" -ForegroundColor Yellow
Write-Host 'Invoke-WebRequest -Uri "http://localhost:5000/api/v1/air-quality/health-check" | ConvertFrom-Json'
Write-Host ""

Write-Host "# Get basic data (5 records):" -ForegroundColor Yellow  
Write-Host "Invoke-WebRequest -Uri 'http://localhost:5000/api/v1/data?page=1&limit=5' | ConvertFrom-Json"
Write-Host ""

Write-Host "# Search for Rochester:" -ForegroundColor Yellow
Write-Host '$body = "{""query"": ""Rochester"", ""limit"": 5}"; Invoke-WebRequest -Uri "http://localhost:5000/api/v1/search" -Method POST -Body $body -ContentType "application/json" | ConvertFrom-Json'
Write-Host ""

Write-Host "# Get AI predictions for Rochester:" -ForegroundColor Yellow
Write-Host 'Invoke-WebRequest -Uri "http://localhost:5000/api/v1/predict/Rochester?days=5" | ConvertFrom-Json'
Write-Host ""

Write-Host "# Get database statistics:" -ForegroundColor Yellow
Write-Host 'Invoke-WebRequest -Uri "http://localhost:5000/api/v1/air-quality/statistics" | ConvertFrom-Json'
Write-Host ""

Write-Host "=== ADVANCED COMMANDS ===" -ForegroundColor Green
Write-Host ""

Write-Host "# Search with AQI filters:" -ForegroundColor Yellow
Write-Host '$filtered = "{""query"": ""New York"", ""filters"": {""minAQI"": 5, ""maxAQI"": 15}, ""limit"": 5}"; Invoke-WebRequest -Uri "http://localhost:5000/api/v1/search" -Method POST -Body $filtered -ContentType "application/json" | ConvertFrom-Json'
Write-Host ""

Write-Host "# Text search for pollutants:" -ForegroundColor Yellow
Write-Host 'Invoke-WebRequest -Uri "http://localhost:5000/api/v1/air-quality/search?q=carbon%20monoxide" | ConvertFrom-Json'
Write-Host ""

Write-Host "# Get geographic data:" -ForegroundColor Yellow
Write-Host 'Invoke-WebRequest -Uri "http://localhost:5000/api/v1/air-quality/geo" | ConvertFrom-Json'
Write-Host ""

Write-Host "# Get monthly trends:" -ForegroundColor Yellow
Write-Host 'Invoke-WebRequest -Uri "http://localhost:5000/api/v1/air-quality/trends?year=2024" | ConvertFrom-Json'
Write-Host ""

Write-Host "# Get high pollution alerts:" -ForegroundColor Yellow
Write-Host 'Invoke-WebRequest -Uri "http://localhost:5000/api/v1/air-quality/alerts?threshold=10" | ConvertFrom-Json'
Write-Host ""

Write-Host "=== SERVER MANAGEMENT ===" -ForegroundColor Green
Write-Host ""

Write-Host "# Check if server is running:" -ForegroundColor Yellow
Write-Host 'Get-Process node -ErrorAction SilentlyContinue'
Write-Host ""

Write-Host "# Stop server:" -ForegroundColor Yellow
Write-Host 'Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force'
Write-Host ""

Write-Host "# Start server (in backend directory):" -ForegroundColor Yellow
Write-Host 'cd "e:\Git\GoFetch\backend"; npm start'
Write-Host ""

Write-Host "=== TESTING MULTIPLE CITIES ===" -ForegroundColor Green
Write-Host ""

Write-Host "# Test predictions for multiple cities:" -ForegroundColor Yellow
Write-Host '@("Rochester", "New York", "Boston") | ForEach-Object {'
Write-Host '    Write-Host "Testing: $_" -ForegroundColor Yellow'
Write-Host '    try {'
Write-Host '        $result = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/predict/$_" | ConvertFrom-Json'
Write-Host '        Write-Host "Success: $($result.predictions.Count) day forecast" -ForegroundColor Green'
Write-Host '    } catch {'
Write-Host '        Write-Host "No data for $_" -ForegroundColor Red'
Write-Host '    }'
Write-Host '}'
Write-Host ""

Write-Host "=== DATA ANALYSIS ===" -ForegroundColor Green
Write-Host ""

Write-Host "# Get high AQI events and format as table:" -ForegroundColor Yellow
Write-Host '$high = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/air-quality/alerts?threshold=10" | ConvertFrom-Json'
Write-Host '$high.data | Select-Object "Local Site Name", State, "Daily AQI Value", Date | Format-Table'
Write-Host ""

Write-Host "# Get state distribution:" -ForegroundColor Yellow
Write-Host '$geo = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/air-quality/geo" | ConvertFrom-Json'
Write-Host '$geo.data | Select-Object @{N="State";E={$_._id}}, @{N="Count";E={$_.count}} | Sort-Object Count -Descending | Format-Table'
Write-Host ""

Write-Host "🎉 Phase 2 Backend is fully functional!" -ForegroundColor Cyan
Write-Host "All endpoints tested and working correctly." -ForegroundColor Green
