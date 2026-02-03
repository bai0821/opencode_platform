# OpenCode Platform - 停止所有服務
# 使用方式: .\stop.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "   OpenCode Platform - 停止服務" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# 停止前端 (Node)
Write-Host "停止前端..." -ForegroundColor Gray
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "  ✅ 前端已停止" -ForegroundColor Green

# 停止後端 (Python/Uvicorn)
Write-Host "停止後端..." -ForegroundColor Gray
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "  ✅ 後端已停止" -ForegroundColor Green

# 詢問是否停止 Qdrant
$answer = Read-Host "停止 Qdrant 容器? (y/N)"
if ($answer -eq "y" -or $answer -eq "Y") {
    docker stop qdrant 2>$null
    Write-Host "  ✅ Qdrant 已停止" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ 服務已停止" -ForegroundColor Green
