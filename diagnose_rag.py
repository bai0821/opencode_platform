"""
診斷腳本 - 檢查 RAG 系統狀態
"""
import os
import sys

def check_qdrant():
    """檢查 Qdrant 中的數據"""
    print("=" * 50)
    print("1. 檢查 Qdrant 連接和數據")
    print("=" * 50)
    
    try:
        from qdrant_client import QdrantClient
        client = QdrantClient(host="localhost", port=6333)
        
        # 列出所有 collection
        collections = client.get_collections()
        print(f"✅ Qdrant 連接成功")
        print(f"   Collections: {[c.name for c in collections.collections]}")
        
        # 檢查 RAG collection
        collection_name = "rag_knowledge_base"
        try:
            info = client.get_collection(collection_name)
            print(f"\n📊 Collection '{collection_name}':")
            print(f"   向量數量: {info.points_count}")
            print(f"   向量維度: {info.config.params.vectors.size}")
            
            # 取樣查看數據
            if info.points_count > 0:
                results = client.scroll(
                    collection_name=collection_name,
                    limit=10,
                    with_payload=True
                )
                
                print(f"\n📋 數據樣本（前 10 筆）:")
                page_labels = set()
                file_names = set()
                
                for point in results[0]:
                    payload = point.payload
                    file_name = payload.get("file_name", "N/A")
                    page_label = payload.get("page_label", "N/A")
                    content_type = payload.get("content_type", "N/A")
                    
                    file_names.add(file_name)
                    page_labels.add(page_label)
                    
                    text_preview = payload.get("text", "")[:50] + "..."
                    print(f"   - 文件: {file_name}, 頁碼: {page_label}, 類型: {content_type}")
                
                print(f"\n📈 統計:")
                print(f"   文件: {file_names}")
                print(f"   頁碼範圍: {sorted(page_labels, key=lambda x: int(x) if x.isdigit() else 0)}")
                
        except Exception as e:
            print(f"❌ Collection '{collection_name}' 不存在或錯誤: {e}")
            
    except Exception as e:
        print(f"❌ Qdrant 連接失敗: {e}")

def check_ocr():
    """檢查 OCR 工具"""
    print("\n" + "=" * 50)
    print("2. 檢查 OCR 工具")
    print("=" * 50)
    
    # 檢查 pytesseract
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract OCR 已安裝: 版本 {version}")
        
        # 檢查語言包
        langs = pytesseract.get_languages()
        print(f"   可用語言: {langs}")
        
        if 'chi_tra' in langs or 'chi_sim' in langs:
            print("   ✅ 中文語言包已安裝")
        else:
            print("   ⚠️ 中文語言包未安裝，建議安裝 chi_tra（繁體）或 chi_sim（簡體）")
            
    except Exception as e:
        print(f"❌ Tesseract OCR 不可用: {e}")
        print("   安裝方法: https://github.com/UB-Mannheim/tesseract/wiki")
    
    # 檢查 easyocr
    try:
        import easyocr
        print(f"✅ EasyOCR 已安裝")
    except ImportError:
        print(f"⚠️ EasyOCR 未安裝（可選）")
        print("   安裝方法: pip install easyocr")

def check_parser():
    """測試 parser"""
    print("\n" + "=" * 50)
    print("3. 測試 MultimodalParser")
    print("=" * 50)
    
    try:
        from opencode.services.knowledge_base.multimodal_parser import MultimodalParser
        parser = MultimodalParser()
        
        print(f"✅ Parser 初始化成功")
        print(f"   OCR 可用: {parser._ocr_available}")
        if parser._ocr_available:
            print(f"   OCR 方法: {parser._ocr_method}")
        
    except Exception as e:
        print(f"❌ Parser 初始化失敗: {e}")
        import traceback
        traceback.print_exc()

def test_parse_pdf():
    """測試解析 PDF"""
    print("\n" + "=" * 50)
    print("4. 測試 PDF 解析")
    print("=" * 50)
    
    # 查找 data/raw 中的 PDF
    pdf_dir = "data/raw"
    if not os.path.exists(pdf_dir):
        print(f"❌ 目錄不存在: {pdf_dir}")
        return
    
    pdfs = [f for f in os.listdir(pdf_dir) if f.endswith('.pdf')]
    if not pdfs:
        print(f"❌ 沒有找到 PDF 文件")
        return
    
    print(f"📁 找到 {len(pdfs)} 個 PDF: {pdfs}")
    
    # 測試解析第一個
    test_pdf = os.path.join(pdf_dir, pdfs[0])
    print(f"\n🔍 測試解析: {test_pdf}")
    
    try:
        from opencode.services.knowledge_base.multimodal_parser import MultimodalParser
        parser = MultimodalParser()
        
        results = parser.parse(test_pdf)
        
        print(f"\n📊 解析結果:")
        print(f"   總區塊數: {len(results)}")
        
        # 統計
        pages = set()
        types = {}
        
        for r in results:
            meta = r.get("metadata", {})
            pages.add(meta.get("page_label", "?"))
            ct = meta.get("content_type", "text")
            types[ct] = types.get(ct, 0) + 1
        
        print(f"   頁碼範圍: {sorted(pages, key=lambda x: int(x) if x.isdigit() else 0)}")
        print(f"   內容類型: {types}")
        
        # 顯示幾個樣本
        print(f"\n📝 區塊樣本:")
        for i, r in enumerate(results[:5]):
            meta = r.get("metadata", {})
            text = r.get("text", "")[:80] + "..."
            print(f"   [{i+1}] 頁 {meta.get('page_label')}, 類型 {meta.get('content_type')}: {text}")
            
    except Exception as e:
        print(f"❌ 解析失敗: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🔧 OpenCode RAG 系統診斷")
    print("=" * 50)
    
    check_qdrant()
    check_ocr()
    check_parser()
    test_parse_pdf()
    
    print("\n" + "=" * 50)
    print("診斷完成！")
    print("=" * 50)
    print("\n💡 建議:")
    print("1. 如果頁碼都是第1頁，請重新上傳 PDF")
    print("2. 如果圖片無法識別，請安裝 Tesseract OCR")
    print("3. 重新上傳後，圖片文字會自動 OCR")
