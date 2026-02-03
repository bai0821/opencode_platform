"""
檢查 Qdrant 中的向量 payload 是否包含 file_name
"""

import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()

def check_qdrant():
    qdrant_host = os.getenv("QDRANT_HOST", "localhost")
    qdrant_port = os.getenv("QDRANT_PORT", "6333")
    collection_name = os.getenv("QDRANT_COLLECTION", "rag_knowledge_base")
    
    print(f"連接 Qdrant: {qdrant_host}:{qdrant_port}")
    client = QdrantClient(host=qdrant_host, port=int(qdrant_port))
    
    # 獲取 collection 信息
    try:
        info = client.get_collection(collection_name)
        print(f"\nCollection: {collection_name}")
        print(f"向量數量: {info.points_count}")
        print(f"向量維度: {info.config.params.vectors.size}")
    except Exception as e:
        print(f"錯誤: {e}")
        return
    
    # 查看一些樣本向量
    print("\n--- 樣本向量 payload ---")
    results = client.scroll(
        collection_name=collection_name,
        limit=5,
        with_payload=True,
        with_vectors=False
    )
    
    for i, point in enumerate(results[0]):
        print(f"\n[{i+1}] ID: {point.id}")
        payload = point.payload
        print(f"  file_name: {payload.get('file_name', '❌ 不存在')}")
        print(f"  page_label: {payload.get('page_label', '❌ 不存在')}")
        print(f"  text (前50字): {payload.get('text', '')[:50]}...")
        print(f"  所有 keys: {list(payload.keys())}")

if __name__ == "__main__":
    check_qdrant()
