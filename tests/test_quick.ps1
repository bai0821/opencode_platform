<# 
OpenCode Platform v4.0 - 快速 API 測試腳本 (PowerShell)

使用方式:
    .\test_quick.ps1              # 測試所有
    .\test_quick.ps1 -Phase 1     # 只測試 Phase 1
    .\test_quick.ps1 -Verbose     # 詳細輸出
    
配置會從 .env 文件自動讀取
#>

param(
    [int]$Phase = -1,
    [switch]$Verbose
)

# ============================================================
# 讀取 .env 配置
# ============================================================

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $ProjectRoot ".env"

function Read-EnvFile {
    param([string]$Path)
    $config = @{}
    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim() -replace '^["'']|["'']$', ''
                $config[$key] = $value
            }
        }
    }
    return $config
}

$config = Read-EnvFile -Path $envFile

# 設定配置（優先使用 .env，否則使用預設值）
$API_HOST = if ($config["API_HOST"]) { $config["API_HOST"] } else { "localhost" }
$API_PORT = if ($config["API_PORT"]) { $config["API_PORT"] } else { "8000" }
$BASE = "http://${API_HOST}:${API_PORT}"

$PASS = 0
$FAIL = 0
$SKIP = 0
$Token = $null

function Write-Status {
    param($Status, $Name, $Message = "")
    switch ($Status) {
        "pass" { 
            Write-Host "  ✅ $Name" -ForegroundColor Green
            $script:PASS++
        }
        "fail" { 
            Write-Host "  ❌ $Name" -ForegroundColor Red -NoNewline
            if ($Message) { Write-Host ": $Message" -ForegroundColor Red } else { Write-Host "" }
            $script:FAIL++
        }
        "skip" { 
            Write-Host "  ⏭️ $Name" -ForegroundColor Yellow -NoNewline
            if ($Message) { Write-Host ": $Message" -ForegroundColor Yellow } else { Write-Host "" }
            $script:SKIP++
        }
        "warn" { 
            Write-Host "  ⚠️ $Name" -ForegroundColor Yellow -NoNewline
            if ($Message) { Write-Host ": $Message" -ForegroundColor Yellow } else { Write-Host "" }
        }
    }
}

function Test-API {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    try {
        $uri = "$BASE$Endpoint"
        $params = @{
            Method = $Method
            Uri = $uri
            ContentType = "application/json"
            Headers = $Headers
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Compress)
        }
        
        if ($script:Token -and -not $Headers.ContainsKey("Authorization")) {
            $params.Headers["Authorization"] = "Bearer $($script:Token)"
        }
        
        $response = Invoke-RestMethod @params
        return @{ Success = $true; Data = $response }
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorMsg = $reader.ReadToEnd()
            } catch {}
        }
        return @{ Success = $false; Error = $errorMsg }
    }
}

# ==================== Phase 0: 環境準備 ====================
function Test-Phase0 {
    Write-Host "`n📋 Phase 0: 環境準備" -ForegroundColor Cyan
    
    # 0.1 後端
    $result = Test-API -Method GET -Endpoint "/health"
    if ($result.Success) {
        Write-Status "pass" "0.1 後端 API" "status: $($result.Data.status)"
    } else {
        Write-Status "fail" "0.1 後端 API" "無法連接 - 請確保後端已啟動"
        return $false
    }
    
    # 0.2 Qdrant
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:6333" -TimeoutSec 5
        Write-Status "pass" "0.2 Qdrant"
    } catch {
        Write-Status "fail" "0.2 Qdrant" "無法連接"
        return $false
    }
    
    # 0.3 前端
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
        Write-Status "pass" "0.3 前端"
    } catch {
        Write-Status "warn" "0.3 前端" "未啟動（不影響 API 測試）"
    }
    
    return $true
}

# ==================== Phase 1: RAG 核心 ====================
function Test-Phase1 {
    Write-Host "`n📚 Phase 1: RAG 核心功能" -ForegroundColor Cyan
    
    # 1.1 Stats
    $result = Test-API -Method GET -Endpoint "/stats"
    if ($result.Success) { Write-Status "pass" "1.1 系統統計" }
    else { Write-Status "fail" "1.1 系統統計" $result.Error }
    
    # 1.2 文件列表
    $result = Test-API -Method GET -Endpoint "/documents"
    if ($result.Success) {
        $count = if ($result.Data -is [array]) { $result.Data.Count } else { 0 }
        Write-Status "pass" "1.2 文件列表" "$count 個文件"
    } else { Write-Status "fail" "1.2 文件列表" $result.Error }
    
    # 1.3 搜尋
    $result = Test-API -Method POST -Endpoint "/search" -Body @{ query = "test"; top_k = 3 }
    if ($result.Success) {
        $count = $result.Data.results.Count
        Write-Status "pass" "1.3 語意搜尋" "$count 個結果"
    } else { Write-Status "warn" "1.3 語意搜尋" "可能沒有上傳文件" }
    
    # 1.4 同步對話
    $result = Test-API -Method POST -Endpoint "/chat" -Body @{ message = "你好"; session_id = "test" }
    if ($result.Success) { Write-Status "pass" "1.4 同步對話" }
    else { Write-Status "fail" "1.4 同步對話" $result.Error }
}

# ==================== Phase 2: MCP Services ====================
function Test-Phase2 {
    Write-Host "`n🔌 Phase 2: MCP Services" -ForegroundColor Cyan
    
    # 2.1 Research
    $result = Test-API -Method GET -Endpoint "/research/tasks"
    if ($result.Success) { Write-Status "pass" "2.1 Research API" }
    else { Write-Status "fail" "2.1 Research API" $result.Error }
    
    # 2.2 Qdrant Debug
    $result = Test-API -Method GET -Endpoint "/debug/qdrant"
    if ($result.Success) {
        $points = $result.Data.collection.points_count
        Write-Status "pass" "2.2 Qdrant Debug" "$points 個向量"
    } else { Write-Status "fail" "2.2 Qdrant Debug" $result.Error }
    
    Write-Status "skip" "2.3 Sandbox" "需要 Docker"
    Write-Status "skip" "2.4 Web Search" "需要對話觸發"
    Write-Status "skip" "2.5 RepoOps" "需要對話觸發"
}

# ==================== Phase 3: 企業功能 ====================
function Test-Phase3 {
    Write-Host "`n🏢 Phase 3: 企業功能" -ForegroundColor Cyan
    
    # 3.1 管理員登入
    $result = Test-API -Method POST -Endpoint "/auth/login" -Body @{ username = "admin"; password = "admin123" } -Headers @{}
    if ($result.Success -and $result.Data.access_token) {
        $script:Token = $result.Data.access_token
        Write-Status "pass" "3.1 管理員登入"
    } else {
        Write-Status "fail" "3.1 管理員登入" $result.Error
        return
    }
    
    # 3.2 獲取當前用戶
    $result = Test-API -Method GET -Endpoint "/auth/me"
    if ($result.Success) { Write-Status "pass" "3.2 當前用戶" "user: $($result.Data.username)" }
    else { Write-Status "fail" "3.2 當前用戶" $result.Error }
    
    # 3.3 用戶列表
    $result = Test-API -Method GET -Endpoint "/auth/users"
    if ($result.Success) {
        $count = if ($result.Data -is [array]) { $result.Data.Count } else { 0 }
        Write-Status "pass" "3.3 用戶列表" "$count 個用戶"
    } else { Write-Status "fail" "3.3 用戶列表" $result.Error }
    
    # 3.4 審計日誌
    $result = Test-API -Method GET -Endpoint "/audit/logs?limit=5"
    if ($result.Success) {
        $count = $result.Data.logs.Count
        Write-Status "pass" "3.4 審計日誌" "$count 條記錄"
    } else { Write-Status "fail" "3.4 審計日誌" $result.Error }
    
    # 3.5 成本儀表板
    $result = Test-API -Method GET -Endpoint "/cost/dashboard"
    if ($result.Success) {
        $cost = $result.Data.today.cost
        Write-Status "pass" "3.5 成本儀表板" "今日: `$$cost"
    } else { Write-Status "fail" "3.5 成本儀表板" $result.Error }
}

# ==================== Phase 4: 進階功能 ====================
function Test-Phase4 {
    Write-Host "`n🚀 Phase 4: 進階功能" -ForegroundColor Cyan
    
    if (-not $script:Token) {
        Write-Status "skip" "4.x 需要先通過 Phase 3"
        return
    }
    
    # 4.1 插件列表
    $result = Test-API -Method GET -Endpoint "/plugins"
    if ($result.Success) {
        Write-Status "pass" "4.1 插件列表" "$($result.Data.count) 個插件"
    } else { Write-Status "fail" "4.1 插件列表" $result.Error }
    
    # 4.2 發現插件
    $result = Test-API -Method POST -Endpoint "/plugins/discover"
    if ($result.Success) {
        Write-Status "pass" "4.2 發現插件" "發現 $($result.Data.count) 個"
    } else { Write-Status "fail" "4.2 發現插件" $result.Error }
    
    # 4.3 技能列表
    $result = Test-API -Method GET -Endpoint "/marketplace/skills"
    if ($result.Success) {
        Write-Status "pass" "4.3 技能列表" "$($result.Data.count) 個技能"
    } else { Write-Status "fail" "4.3 技能列表" $result.Error }
    
    # 4.4 Agent 角色
    $result = Test-API -Method GET -Endpoint "/agents/roles"
    if ($result.Success) {
        Write-Status "pass" "4.4 Agent 角色" "$($result.Data.roles.Count) 個角色"
    } else { Write-Status "fail" "4.4 Agent 角色" $result.Error }
    
    # 4.5 Agent 列表
    $result = Test-API -Method GET -Endpoint "/agents"
    if ($result.Success) {
        Write-Status "pass" "4.5 Agent 列表" "$($result.Data.count) 個 Agent"
    } else { Write-Status "fail" "4.5 Agent 列表" $result.Error }
}

# ==================== 主程式 ====================

Write-Host ""
Write-Host "=" * 60 -ForegroundColor White
Write-Host "  OpenCode Platform v4.0 - 快速測試" -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor White
Write-Host "  API: $BASE"

$startTime = Get-Date

if ($Phase -eq -1 -or $Phase -eq 0) {
    if (-not (Test-Phase0)) {
        Write-Host "`n❌ 環境檢查失敗，請先修復問題" -ForegroundColor Red
        exit 1
    }
}

if ($Phase -eq -1 -or $Phase -eq 1) { Test-Phase1 }
if ($Phase -eq -1 -or $Phase -eq 2) { Test-Phase2 }
if ($Phase -eq -1 -or $Phase -eq 3) { Test-Phase3 }
if ($Phase -eq -1 -or $Phase -eq 4) { Test-Phase4 }

$elapsed = ((Get-Date) - $startTime).TotalSeconds

Write-Host ""
Write-Host "=" * 60 -ForegroundColor White
Write-Host "  測試結果摘要" -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor White
Write-Host "  總計: $($PASS + $FAIL + $SKIP) | " -NoNewline
Write-Host "通過: $PASS" -ForegroundColor Green -NoNewline
Write-Host " | " -NoNewline
Write-Host "失敗: $FAIL" -ForegroundColor Red -NoNewline
Write-Host " | 跳過: $SKIP"
Write-Host "  耗時: $([math]::Round($elapsed, 2)) 秒"
Write-Host ""

if ($FAIL -gt 0) {
    exit 1
}
