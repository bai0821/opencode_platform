#!/usr/bin/env python3
"""
OpenCode Platform v4.0 - 自動化測試腳本

使用方式:
    python test_all.py                    # 測試所有
    python test_all.py --phase 1          # 只測試 Phase 1
    python test_all.py --verbose          # 詳細輸出
    python test_all.py --fix              # 顯示修復建議
    
配置:
    - 從 .env 文件讀取 API_PORT
    - 或使用 --url 參數指定
"""

import os
import sys
import json
import time
import argparse
import requests
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

# 嘗試讀取 .env 配置
def load_env_config():
    """從 .env 文件讀取配置"""
    config = {}
    
    # 找到專案根目錄
    current = Path(__file__).resolve().parent
    while current != current.parent:
        env_file = current / ".env"
        if env_file.exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        config[key.strip()] = value.strip().strip('"').strip("'")
            break
        current = current.parent
    
    return config

# 載入配置
_env_config = load_env_config()

# 配置 - 優先使用環境變數，其次是 .env 文件，最後是預設值
API_HOST = os.getenv("API_HOST") or _env_config.get("API_HOST", "localhost")
API_PORT = os.getenv("API_PORT") or _env_config.get("API_PORT", "8000")
BASE_URL = f"http://{API_HOST}:{API_PORT}"
FRONTEND_PORT = os.getenv("FRONTEND_PORT") or _env_config.get("FRONTEND_PORT", "5173")
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"

# 顏色輸出
class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def color(text: str, c: str) -> str:
    return f"{c}{text}{Color.END}"

class TestStatus(Enum):
    PASS = "✅"
    FAIL = "❌"
    SKIP = "⏭️"
    WARN = "⚠️"

@dataclass
class TestResult:
    name: str
    status: TestStatus
    message: str = ""
    error: str = ""
    fix_hint: str = ""

class OpenCodeTester:
    def __init__(self, verbose: bool = False, show_fix: bool = False):
        self.verbose = verbose
        self.show_fix = show_fix
        self.results: List[TestResult] = []
        self.token: Optional[str] = None
        self.admin_token: Optional[str] = None
        
    def log(self, msg: str, level: str = "info"):
        if self.verbose or level in ["error", "warn"]:
            prefix = {
                "info": color("ℹ️ ", Color.BLUE),
                "success": color("✅ ", Color.GREEN),
                "error": color("❌ ", Color.RED),
                "warn": color("⚠️ ", Color.YELLOW),
            }.get(level, "")
            print(f"  {prefix}{msg}")
    
    def add_result(self, name: str, status: TestStatus, message: str = "", error: str = "", fix_hint: str = ""):
        result = TestResult(name, status, message, error, fix_hint)
        self.results.append(result)
        
        status_str = status.value
        if status == TestStatus.PASS:
            print(f"  {status_str} {name}")
        elif status == TestStatus.FAIL:
            print(f"  {status_str} {name}: {color(message, Color.RED)}")
            if error and self.verbose:
                print(f"      Error: {error[:200]}")
            if fix_hint and self.show_fix:
                print(f"      {color('Fix:', Color.YELLOW)} {fix_hint}")
        elif status == TestStatus.SKIP:
            print(f"  {status_str} {name}: {color(message, Color.YELLOW)}")
        elif status == TestStatus.WARN:
            print(f"  {status_str} {name}: {color(message, Color.YELLOW)}")
    
    def request(self, method: str, endpoint: str, **kwargs) -> Tuple[bool, dict]:
        """發送請求並返回 (成功, 回應/錯誤)"""
        url = f"{BASE_URL}{endpoint}"
        headers = kwargs.pop("headers", {})
        
        # 自動加入 token
        if self.admin_token and "Authorization" not in headers:
            headers["Authorization"] = f"Bearer {self.admin_token}"
        
        try:
            resp = requests.request(method, url, headers=headers, timeout=30, **kwargs)
            if resp.status_code < 400:
                try:
                    return True, resp.json()
                except:
                    return True, {"raw": resp.text}
            else:
                try:
                    return False, resp.json()
                except:
                    return False, {"error": resp.text, "status_code": resp.status_code}
        except requests.exceptions.ConnectionError:
            return False, {"error": "Connection refused - 服務未啟動"}
        except Exception as e:
            return False, {"error": str(e)}

    # ==================== Phase 0: 環境準備 ====================
    
    def test_phase_0(self):
        print(color("\n📋 Phase 0: 環境準備", Color.CYAN + Color.BOLD))
        
        # 0.1 後端健康檢查
        ok, data = self.request("GET", "/health")
        if ok:
            self.add_result("0.1 後端 API", TestStatus.PASS, f"status: {data.get('status')}")
        else:
            self.add_result("0.1 後端 API", TestStatus.FAIL, "無法連接", 
                          str(data), "確保後端已啟動: uvicorn opencode.api.main:app --port 8000")
            return False  # 後端沒啟動，後續測試無意義
        
        # 0.2 Qdrant 檢查
        try:
            resp = requests.get("http://localhost:6333", timeout=5)
            self.add_result("0.2 Qdrant", TestStatus.PASS)
        except:
            self.add_result("0.2 Qdrant", TestStatus.FAIL, "無法連接",
                          fix_hint="啟動 Qdrant: docker run -d -p 6333:6333 qdrant/qdrant")
            return False
        
        # 0.3 前端檢查
        try:
            resp = requests.get(FRONTEND_URL, timeout=5)
            self.add_result("0.3 前端", TestStatus.PASS)
        except:
            self.add_result("0.3 前端", TestStatus.WARN, "前端未啟動（不影響 API 測試）",
                          fix_hint="cd frontend && npm run dev")
        
        return True

    # ==================== Phase 1: RAG 核心 ====================
    
    def test_phase_1(self):
        print(color("\n📚 Phase 1: RAG 核心功能", Color.CYAN + Color.BOLD))
        
        # 1.1 Stats
        ok, data = self.request("GET", "/stats")
        if ok:
            self.add_result("1.1 系統統計", TestStatus.PASS)
        else:
            self.add_result("1.1 系統統計", TestStatus.FAIL, str(data.get("error", "")))
        
        # 1.2 文件列表
        ok, data = self.request("GET", "/documents")
        if ok:
            doc_count = len(data) if isinstance(data, list) else 0
            self.add_result("1.2 文件列表", TestStatus.PASS, f"{doc_count} 個文件")
        else:
            self.add_result("1.2 文件列表", TestStatus.FAIL, str(data))
        
        # 1.3 搜尋 API
        ok, data = self.request("POST", "/search", json={"query": "test", "top_k": 3})
        if ok:
            result_count = len(data.get("results", []))
            self.add_result("1.3 語意搜尋", TestStatus.PASS, f"{result_count} 個結果")
        else:
            # 可能是沒有文件
            if "results" in str(data):
                self.add_result("1.3 語意搜尋", TestStatus.WARN, "無搜尋結果（可能沒有上傳文件）")
            else:
                self.add_result("1.3 語意搜尋", TestStatus.FAIL, str(data.get("error", data)))
        
        # 1.4 同步對話 API
        ok, data = self.request("POST", "/chat", json={"message": "你好", "session_id": "test"})
        if ok:
            self.add_result("1.4 同步對話", TestStatus.PASS)
        else:
            self.add_result("1.4 同步對話", TestStatus.FAIL, str(data.get("detail", data)))
        
        # 1.5 串流對話（只檢查連線）
        try:
            resp = requests.post(
                f"{BASE_URL}/chat/stream",
                json={"message": "hi", "session_id": "test"},
                headers={"Accept": "text/event-stream"},
                stream=True,
                timeout=10
            )
            if resp.status_code == 200:
                self.add_result("1.5 串流對話", TestStatus.PASS)
            else:
                self.add_result("1.5 串流對話", TestStatus.FAIL, f"HTTP {resp.status_code}")
        except Exception as e:
            self.add_result("1.5 串流對話", TestStatus.FAIL, str(e))

    # ==================== Phase 2: MCP Services ====================
    
    def test_phase_2(self):
        print(color("\n🔌 Phase 2: MCP Services", Color.CYAN + Color.BOLD))
        
        # 2.1 Research API
        ok, data = self.request("GET", "/research/tasks")
        if ok:
            self.add_result("2.1 Research API", TestStatus.PASS)
        else:
            self.add_result("2.1 Research API", TestStatus.FAIL, str(data))
        
        # 2.2 Qdrant Debug API
        ok, data = self.request("GET", "/debug/qdrant")
        if ok:
            collection = data.get("collection", {})
            points = collection.get("points_count", 0)
            self.add_result("2.2 Qdrant Debug", TestStatus.PASS, f"{points} 個向量")
        else:
            self.add_result("2.2 Qdrant Debug", TestStatus.FAIL, str(data))
        
        # 2.3 Sandbox（需要 Docker）
        # 這個需要特殊測試，暫時跳過
        self.add_result("2.3 Sandbox", TestStatus.SKIP, "需要 Docker 和手動測試")
        
        # 2.4 Web Search（需要觸發）
        self.add_result("2.4 Web Search", TestStatus.SKIP, "需要通過對話觸發")
        
        # 2.5 RepoOps（需要觸發）
        self.add_result("2.5 RepoOps", TestStatus.SKIP, "需要通過對話觸發")

    # ==================== Phase 3: 企業功能 ====================
    
    def test_phase_3(self):
        print(color("\n🏢 Phase 3: 企業功能", Color.CYAN + Color.BOLD))
        
        # 3.1 管理員登入
        ok, data = self.request("POST", "/auth/login", 
                                json={"username": "admin", "password": "admin123"},
                                headers={})  # 不帶 token
        if ok and "access_token" in data:
            self.admin_token = data["access_token"]
            self.add_result("3.1 管理員登入", TestStatus.PASS)
        else:
            self.add_result("3.1 管理員登入", TestStatus.FAIL, 
                          str(data.get("detail", data)),
                          fix_hint="確保 auth 模組正確載入")
            return  # 沒有 token 後續測試無法進行
        
        # 3.2 獲取當前用戶
        ok, data = self.request("GET", "/auth/me")
        if ok:
            self.add_result("3.2 獲取當前用戶", TestStatus.PASS, f"user: {data.get('username')}")
        else:
            self.add_result("3.2 獲取當前用戶", TestStatus.FAIL, str(data))
        
        # 3.3 用戶列表（需要 admin）
        ok, data = self.request("GET", "/auth/users")
        if ok:
            user_count = len(data) if isinstance(data, list) else 0
            self.add_result("3.3 用戶列表", TestStatus.PASS, f"{user_count} 個用戶")
        else:
            self.add_result("3.3 用戶列表", TestStatus.FAIL, str(data))
        
        # 3.4 註冊新用戶
        test_user = f"test_{int(time.time())}"
        ok, data = self.request("POST", "/auth/register",
                                json={"username": test_user, "password": "test123"},
                                headers={})
        if ok:
            self.add_result("3.4 用戶註冊", TestStatus.PASS)
        else:
            self.add_result("3.4 用戶註冊", TestStatus.FAIL, str(data.get("detail", data)))
        
        # 3.5 審計日誌
        ok, data = self.request("GET", "/audit/logs?limit=5")
        if ok:
            log_count = len(data.get("logs", []))
            self.add_result("3.5 審計日誌", TestStatus.PASS, f"{log_count} 條記錄")
        else:
            self.add_result("3.5 審計日誌", TestStatus.FAIL, str(data))
        
        # 3.6 審計統計
        ok, data = self.request("GET", "/audit/stats")
        if ok:
            self.add_result("3.6 審計統計", TestStatus.PASS)
        else:
            self.add_result("3.6 審計統計", TestStatus.FAIL, str(data))
        
        # 3.7 成本儀表板
        ok, data = self.request("GET", "/cost/dashboard")
        if ok:
            today_cost = data.get("today", {}).get("cost", 0)
            self.add_result("3.7 成本儀表板", TestStatus.PASS, f"今日: ${today_cost}")
        else:
            self.add_result("3.7 成本儀表板", TestStatus.FAIL, str(data))
        
        # 3.8 每日成本
        ok, data = self.request("GET", "/cost/daily")
        if ok:
            self.add_result("3.8 每日成本", TestStatus.PASS)
        else:
            self.add_result("3.8 每日成本", TestStatus.FAIL, str(data))

    # ==================== Phase 4: 進階功能 ====================
    
    def test_phase_4(self):
        print(color("\n🚀 Phase 4: 進階功能", Color.CYAN + Color.BOLD))
        
        if not self.admin_token:
            self.add_result("4.x 需要先通過 Phase 3 登入", TestStatus.SKIP)
            return
        
        # 4.1 插件列表
        ok, data = self.request("GET", "/plugins")
        if ok:
            plugin_count = data.get("count", 0)
            self.add_result("4.1 插件列表", TestStatus.PASS, f"{plugin_count} 個插件")
        else:
            self.add_result("4.1 插件列表", TestStatus.FAIL, str(data))
        
        # 4.2 發現插件
        ok, data = self.request("POST", "/plugins/discover")
        if ok:
            discovered = data.get("count", 0)
            self.add_result("4.2 發現插件", TestStatus.PASS, f"發現 {discovered} 個")
        else:
            self.add_result("4.2 發現插件", TestStatus.FAIL, str(data))
        
        # 4.3 技能市場 - 列表
        ok, data = self.request("GET", "/marketplace/skills")
        if ok:
            skill_count = data.get("count", 0)
            self.add_result("4.3 技能列表", TestStatus.PASS, f"{skill_count} 個技能")
        else:
            self.add_result("4.3 技能列表", TestStatus.FAIL, str(data))
        
        # 4.4 技能市場 - 分類
        ok, data = self.request("GET", "/marketplace/categories")
        if ok:
            categories = data.get("categories", [])
            self.add_result("4.4 技能分類", TestStatus.PASS, f"{len(categories)} 個分類")
        else:
            self.add_result("4.4 技能分類", TestStatus.FAIL, str(data))
        
        # 4.5 Agent 角色
        ok, data = self.request("GET", "/agents/roles")
        if ok:
            roles = data.get("roles", [])
            self.add_result("4.5 Agent 角色", TestStatus.PASS, f"{len(roles)} 個角色")
        else:
            self.add_result("4.5 Agent 角色", TestStatus.FAIL, str(data))
        
        # 4.6 Agent 列表
        ok, data = self.request("GET", "/agents")
        if ok:
            agent_count = data.get("count", 0)
            self.add_result("4.6 Agent 列表", TestStatus.PASS, f"{agent_count} 個 Agent")
        else:
            self.add_result("4.6 Agent 列表", TestStatus.FAIL, str(data))

    # ==================== 執行測試 ====================
    
    def run_all(self, phases: List[int] = None):
        print(color("\n" + "="*60, Color.BOLD))
        print(color("  OpenCode Platform v4.0 - 自動化測試", Color.BOLD))
        print(color("="*60, Color.BOLD))
        print(f"  API: {BASE_URL}")
        print(f"  Frontend: {FRONTEND_URL}")
        
        if phases is None:
            phases = [0, 1, 2, 3, 4]
        
        start_time = time.time()
        
        if 0 in phases:
            if not self.test_phase_0():
                print(color("\n❌ 環境檢查失敗，請先修復問題", Color.RED))
                return
        
        if 1 in phases:
            self.test_phase_1()
        
        if 2 in phases:
            self.test_phase_2()
        
        if 3 in phases:
            self.test_phase_3()
        
        if 4 in phases:
            self.test_phase_4()
        
        # 統計
        elapsed = time.time() - start_time
        total = len(self.results)
        passed = sum(1 for r in self.results if r.status == TestStatus.PASS)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAIL)
        skipped = sum(1 for r in self.results if r.status == TestStatus.SKIP)
        warned = sum(1 for r in self.results if r.status == TestStatus.WARN)
        
        print(color("\n" + "="*60, Color.BOLD))
        print(color("  測試結果摘要", Color.BOLD))
        print(color("="*60, Color.BOLD))
        print(f"  總計: {total} | {color(f'通過: {passed}', Color.GREEN)} | {color(f'失敗: {failed}', Color.RED)} | 跳過: {skipped} | 警告: {warned}")
        print(f"  耗時: {elapsed:.2f} 秒")
        
        if failed > 0:
            print(color("\n❌ 失敗的測試:", Color.RED))
            for r in self.results:
                if r.status == TestStatus.FAIL:
                    print(f"  - {r.name}: {r.message}")
                    if r.fix_hint:
                        print(f"    {color('修復建議:', Color.YELLOW)} {r.fix_hint}")
        
        print()
        return failed == 0


def main():
    parser = argparse.ArgumentParser(description="OpenCode Platform 測試腳本")
    parser.add_argument("--phase", type=int, nargs="+", help="只測試指定的 Phase (0-4)")
    parser.add_argument("--verbose", "-v", action="store_true", help="詳細輸出")
    parser.add_argument("--fix", action="store_true", help="顯示修復建議")
    parser.add_argument("--url", type=str, help="API URL")
    
    args = parser.parse_args()
    
    if args.url:
        global BASE_URL
        BASE_URL = args.url
    
    tester = OpenCodeTester(verbose=args.verbose, show_fix=args.fix)
    success = tester.run_all(phases=args.phase)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
