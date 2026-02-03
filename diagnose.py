#!/usr/bin/env python3
"""
OpenCode Platform - 診斷腳本
用於排查啟動問題和檢查配置
"""

import os
import sys
from pathlib import Path

# 設置路徑
project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root / "src"))

print("=" * 60)
print("  OpenCode Platform - 診斷腳本")
print("=" * 60)

# 1. 檢查 Python 版本
print(f"\n[1] Python 版本: {sys.version}")

# 2. 檢查 .env
env_file = project_root / ".env"
env_example = project_root / ".env.example"
print(f"\n[2] 配置文件:")
print(f"  .env:         {'✅ 存在' if env_file.exists() else '❌ 不存在'}")
print(f"  .env.example: {'✅ 存在' if env_example.exists() else '❌ 不存在'}")

if not env_file.exists() and env_example.exists():
    print(f"  💡 提示: 複製 .env.example 為 .env 並設定 API 密鑰")

# 3. 載入 .env
from dotenv import load_dotenv
load_dotenv(env_file)

# 4. 檢查關鍵依賴
print("\n[3] 依賴檢查:")
dependencies = [
    ("fastapi", "FastAPI"),
    ("uvicorn", "Uvicorn"),
    ("pydantic", "Pydantic"),
    ("openai", "OpenAI"),
    ("qdrant_client", "Qdrant Client"),
    ("cohere", "Cohere"),
    ("jose", "python-jose (JWT)"),
    ("passlib", "Passlib (密碼加密)"),
]

missing = []
for pkg, name in dependencies:
    try:
        __import__(pkg)
        print(f"  ✅ {name}")
    except ImportError:
        print(f"  ❌ {name} - 未安裝")
        missing.append(pkg)

if missing:
    print(f"\n  ⚠️ 請安裝缺少的依賴:")
    print(f"     pip install {' '.join(missing)}")

# 5. 檢查配置
print("\n[4] 當前配置:")

# 直接從環境變數讀取
config_items = [
    ("API_HOST", os.getenv("API_HOST", "0.0.0.0"), "0.0.0.0"),
    ("API_PORT", os.getenv("API_PORT", "8000"), "8000"),
    ("QDRANT_HOST", os.getenv("QDRANT_HOST", "localhost"), "localhost"),
    ("QDRANT_PORT", os.getenv("QDRANT_PORT", "6333"), "6333"),
    ("EMBEDDING_PROVIDER", os.getenv("EMBEDDING_PROVIDER", "cohere"), "cohere"),
    ("LOG_LEVEL", os.getenv("LOG_LEVEL", "INFO"), "INFO"),
]

for name, value, default in config_items:
    source = "環境變數" if os.getenv(name) else "預設值"
    print(f"  {name}: {value} ({source})")

# 6. 檢查 API 密鑰
print("\n[5] API 密鑰:")
api_keys = [
    ("OPENAI_API_KEY", True),
    ("COHERE_API_KEY", False),
]

for var, required in api_keys:
    value = os.getenv(var)
    if value:
        display = value[:10] + "..." if len(value) > 10 else value
        print(f"  ✅ {var}: {display}")
    else:
        status = "❌ 未設置 (必要)" if required else "⚠️ 未設置 (可選)"
        print(f"  {status}: {var}")

# 7. 嘗試導入核心模組
print("\n[6] 模組導入測試:")
modules = [
    "opencode.config.settings",
    "opencode.core.engine",
    "opencode.api.main",
    "opencode.auth",
    "opencode.control_plane.audit",
    "opencode.control_plane.cost",
    "opencode.plugins",
    "opencode.marketplace",
    "opencode.agents",
    "opencode.services.mcp",
    "opencode.services.collections",
]

for mod in modules:
    try:
        __import__(mod)
        print(f"  ✅ {mod}")
    except Exception as e:
        print(f"  ❌ {mod}")
        print(f"     Error: {str(e)[:80]}")

# 8. 嘗試啟動 FastAPI app
print("\n[7] FastAPI App 測試:")
try:
    from opencode.api.main import app
    routes = [r.path for r in app.routes if hasattr(r, 'path')]
    print(f"  ✅ App 載入成功")
    print(f"  📍 路由數量: {len(routes)}")
    
    # 檢查關鍵路由
    key_routes = ["/health", "/auth/login", "/plugins", "/marketplace/skills", "/agents", "/mcp", "/collections"]
    for route in key_routes:
        if route in routes:
            print(f"     ✅ {route}")
        else:
            print(f"     ❌ {route} 不存在")
            
except Exception as e:
    print(f"  ❌ App 載入失敗")
    print(f"     Error: {e}")
    import traceback
    traceback.print_exc()

# 9. 服務連接測試
print("\n[8] 服務連接測試:")

# 測試 Qdrant
qdrant_host = os.getenv("QDRANT_HOST", "localhost")
qdrant_port = os.getenv("QDRANT_PORT", "6333")
try:
    from qdrant_client import QdrantClient
    client = QdrantClient(host=qdrant_host, port=int(qdrant_port), timeout=5)
    collections = client.get_collections()
    print(f"  ✅ Qdrant: http://{qdrant_host}:{qdrant_port} ({len(collections.collections)} collections)")
except Exception as e:
    print(f"  ❌ Qdrant: 連接失敗")
    print(f"     提示: docker run -d -p {qdrant_port}:6333 --name qdrant qdrant/qdrant")

print("\n" + "=" * 60)
print("  診斷完成")
print("=" * 60)

# 10. 啟動建議
print("\n📋 啟動方式:")
api_port = os.getenv("API_PORT", "8000")
print(f"   python run.py api          # 啟動後端 (port: {api_port})")
print(f"   cd frontend && npm run dev # 啟動前端")
print(f"   .\\start.ps1               # 一鍵啟動（Windows）")
