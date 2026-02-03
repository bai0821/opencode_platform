"""
快速 API 測試腳本
"""
import requests
import json

BASE_URL = "http://localhost:8888"

def test_api():
    print("=" * 50)
    print("OpenCode API 測試")
    print("=" * 50)
    
    # 1. 健康檢查
    print("\n1. 健康檢查...")
    try:
        res = requests.get(f"{BASE_URL}/health")
        print(f"   狀態: {res.status_code}")
        print(f"   回應: {res.json()}")
    except Exception as e:
        print(f"   錯誤: {e}")
        return
    
    # 2. 登入
    print("\n2. 登入...")
    try:
        res = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        print(f"   狀態: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            token = data["access_token"]
            print(f"   Token: {token[:50]}...")
            print(f"   用戶: {data['user']['username']} ({data['user']['role']})")
        else:
            print(f"   錯誤: {res.text}")
            return
    except Exception as e:
        print(f"   錯誤: {e}")
        return
    
    # 3. 獲取用戶列表
    print("\n3. 獲取用戶列表...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        res = requests.get(f"{BASE_URL}/auth/users", headers=headers)
        print(f"   狀態: {res.status_code}")
        if res.status_code == 200:
            users = res.json()
            print(f"   用戶數: {len(users)}")
            for u in users:
                print(f"   - {u['username']} ({u['role']})")
        else:
            print(f"   錯誤: {res.text}")
    except Exception as e:
        print(f"   錯誤: {e}")
    
    # 4. 檢查 /api/auth/users (帶 /api 前綴)
    print("\n4. 檢查 /api/auth/users...")
    try:
        res = requests.get(f"{BASE_URL}/api/auth/users", headers=headers)
        print(f"   狀態: {res.status_code}")
        print(f"   回應: {res.text[:200] if len(res.text) > 200 else res.text}")
    except Exception as e:
        print(f"   錯誤: {e}")

    print("\n" + "=" * 50)
    print("測試完成")

if __name__ == "__main__":
    test_api()
