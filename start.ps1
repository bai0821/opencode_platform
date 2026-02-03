# OpenCode Platform - Startup Script (ASCII Version)
# Usage: .\start.ps1 [-Backend] [-Frontend] [-All] [-Docker] [-BuildSandbox]

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$All,
    [switch]$Docker,
    [switch]$BuildSandbox,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Show help
if ($Help) {
    Write-Host @"
OpenCode Platform Startup Script

Usage:
  .\start.ps1 -Backend      Start backend only
  .\start.ps1 -Frontend     Start frontend only
  .\start.ps1 -All          Start both backend and frontend
  .\start.ps1 -Docker       Start with Docker Compose
  .\start.ps1 -BuildSandbox Build sandbox Docker image
  .\start.ps1 -Help         Show this help

Examples:
  .\start.ps1 -All
  .\start.ps1 -Backend
  .\start.ps1 -Docker

"@
    exit 0
}

# Check .env file
function Ensure-EnvFile {
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Write-Warn ".env not found, copying from .env.example"
            Copy-Item ".env.example" ".env"
            Write-Warn "Please edit .env and add your API keys"
        } else {
            Write-Err ".env file not found"
            exit 1
        }
    }
}

# Check Qdrant
function Check-Qdrant {
    Write-Info "Checking Qdrant..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:6333/healthz" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Qdrant is running"
            return $true
        }
    } catch {
        Write-Warn "Qdrant is not running"
        Write-Info "Starting Qdrant with Docker..."
        
        $qdrantRunning = docker ps --filter "name=qdrant" --format "{{.Names}}" 2>$null
        if ($qdrantRunning -eq "qdrant") {
            Write-Success "Qdrant container exists"
        } else {
            $qdrantExists = docker ps -a --filter "name=qdrant" --format "{{.Names}}" 2>$null
            if ($qdrantExists -eq "qdrant") {
                docker start qdrant
            } else {
                docker run -d --name qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant
            }
        }
        
        Start-Sleep -Seconds 3
        return $true
    }
    return $false
}

# Build sandbox image
function Build-Sandbox {
    Write-Info "Building sandbox Docker image..."
    $dockerfilePath = "src/opencode/services/sandbox/Dockerfile"
    if (Test-Path $dockerfilePath) {
        docker build -t opencode-sandbox -f $dockerfilePath src/opencode/services/sandbox/
        Write-Success "Sandbox image built"
    } else {
        Write-Warn "Sandbox Dockerfile not found at $dockerfilePath"
    }
}

# Start backend
function Start-Backend {
    Write-Info "Starting backend..."
    Ensure-EnvFile
    Check-Qdrant
    
    if (-not (Test-Path "venv")) {
        Write-Info "Creating virtual environment..."
        python -m venv venv
    }
    
    Write-Info "Activating venv and installing dependencies..."
    & .\venv\Scripts\Activate.ps1
    pip install -e . -q
    
    Write-Success "Starting API server..."
    python run.py api
}

# Start frontend
function Start-Frontend {
    Write-Info "Starting frontend..."
    
    Set-Location frontend
    
    if (-not (Test-Path "node_modules")) {
        Write-Info "Installing npm dependencies..."
        npm install
    }
    
    Write-Success "Starting dev server..."
    npm run dev
}

# Start with Docker
function Start-Docker {
    Write-Info "Starting with Docker Compose..."
    Ensure-EnvFile
    
    if (Test-Path "docker-compose.yml") {
        docker-compose up -d
        Write-Success "Services started"
        Write-Host ""
        Write-Host "Services:"
        Write-Host "  - Backend:  http://localhost:8888"
        Write-Host "  - Frontend: http://localhost:5173"
        Write-Host "  - Qdrant:   http://localhost:6333"
    } else {
        Write-Err "docker-compose.yml not found"
        exit 1
    }
}

# Main logic
if ($Docker) {
    Start-Docker
} elseif ($BuildSandbox) {
    Build-Sandbox
} elseif ($All) {
    Write-Info "Starting all services..."
    Ensure-EnvFile
    Check-Qdrant
    
    # Start backend in new window
    $backendCmd = "cd '$PWD'; .\venv\Scripts\Activate.ps1; python run.py api"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    Write-Success "Backend starting in new window"
    
    Start-Sleep -Seconds 3
    
    # Start frontend in new window
    $frontendCmd = "cd '$PWD\frontend'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    Write-Success "Frontend starting in new window"
    
    Write-Host ""
    Write-Success "All services started!"
    Write-Host ""
    Write-Host "Access:"
    Write-Host "  - Frontend: http://localhost:5173"
    Write-Host "  - Backend:  http://localhost:8888"
    Write-Host "  - Qdrant:   http://localhost:6333"
    Write-Host ""
    Write-Host "Login: admin / admin123"
    
} elseif ($Backend) {
    Start-Backend
} elseif ($Frontend) {
    Start-Frontend
} else {
    Write-Host "OpenCode Platform"
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\start.ps1 -All       Start all services"
    Write-Host "  .\start.ps1 -Backend   Start backend only"
    Write-Host "  .\start.ps1 -Frontend  Start frontend only"
    Write-Host "  .\start.ps1 -Docker    Start with Docker"
    Write-Host "  .\start.ps1 -Help      Show help"
}
