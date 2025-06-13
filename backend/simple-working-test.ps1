# Simple PowerShell Test Script for Air Quality API
# Tested and working version

Write-Host "Testing Air Quality API..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "`nTest 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/air-quality/health-check" | ConvertFrom-Json
    Write-Host "Status: $($health.message)" -ForegroundColor Green
    Write-Host "Records: $($health.total_records)" -ForegroundColor White
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get Data
Write-Host "`nTest 2: Get Data" -ForegroundColor Yellow
try {
    $data = Invoke-WebRequest -Uri 'http://localhost:5000/api/v1/data?page=1&limit=3' | ConvertFrom-Json
    Write-Host "Success: Got $($data.data.Count) records" -ForegroundColor Green
    Write-Host "Total records: $($data.pagination.total)" -ForegroundColor White
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Search
Write-Host "`nTest 3: Search" -ForegroundColor Yellow
try {
    $body = '{"query": "Rochester", "limit": 3}'
    $search = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/search" -Method POST -Body $body -ContentType "application/json" | ConvertFrom-Json
    Write-Host "Success: Found $($search.data.Count) results" -ForegroundColor Green
    Write-Host "Search method: $($search.search_info.method)" -ForegroundColor White
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Prediction
Write-Host "`nTest 4: AI Prediction" -ForegroundColor Yellow
try {
    $pred = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/predict/Rochester?days=3" | ConvertFrom-Json
    Write-Host "Success: Generated $($pred.predictions.Count) predictions" -ForegroundColor Green
    Write-Host "AI Model: $($pred.model_info.type)" -ForegroundColor White
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Statistics
Write-Host "`nTest 5: Statistics" -ForegroundColor Yellow
try {
    $stats = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/air-quality/statistics" | ConvertFrom-Json
    Write-Host "Success: Got statistics" -ForegroundColor Green
    $avg = [math]::Round($stats.data.avgAQI, 2)
    Write-Host "Average AQI: $avg" -ForegroundColor White
    Write-Host "Total records: $($stats.data.totalRecords)" -ForegroundColor White
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAll tests completed!" -ForegroundColor Cyan
