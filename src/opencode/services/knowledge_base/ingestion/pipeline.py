"""
Ingestion Pipeline - 文件處理管線
從 rag-project 遷移並增強
"""

import logging
import os
from typing import List, Dict, Any, Optional
from pathlib import Path

# 使用統一的路徑工具載入環境變數
from opencode.core.utils import load_env, get_project_root
load_env()

logger = logging.getLogger(__name__)


class DocumentChunk:
    """文件區塊"""
    
    def __init__(
        self,
        text: str,
        metadata: Dict[str, Any] = None
    ):
        self.text = text
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "metadata": self.metadata
        }


class PDFParser:
    """PDF 解析器"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.chunk_size = self.config.get("chunk_size", 1000)
        self.chunk_overlap = self.config.get("chunk_overlap", 200)
    
    def parse(self, file_path: str) -> List[Dict[str, Any]]:
        """
        解析 PDF 檔案
        
        Args:
            file_path: PDF 檔案路徑
            
        Returns:
            文件區塊列表
        """
        file_name = os.path.basename(file_path)
        logger.info(f"📄 ====== 開始解析 PDF ======")
        logger.info(f"📄 檔案: {file_name}")
        logger.info(f"📄 路徑: {file_path}")
        
        # 直接使用 fallback (pymupdf/PyPDF2)，因為更穩定
        documents = self._parse_with_fallback(file_path, file_name)
        
        if documents:
            return documents
        
        # 如果 fallback 失敗，嘗試 docling
        try:
            logger.info("📄 嘗試使用 Docling...")
            return self._parse_with_docling(file_path, file_name)
        except Exception as e:
            logger.error(f"❌ Docling 也失敗了: {e}")
            return []
    
    def _parse_with_docling(
        self, 
        file_path: str, 
        file_name: str
    ) -> List[Dict[str, Any]]:
        """使用 Docling 解析"""
        from docling.document_converter import DocumentConverter
        
        converter = DocumentConverter()
        result = converter.convert(file_path)
        
        documents = []
        
        # 按頁面處理
        for page_idx, page in enumerate(result.document.pages, 1):
            page_text = page.text if hasattr(page, 'text') else str(page)
            
            if not page_text.strip():
                continue
            
            # 分塊
            chunks = self._chunk_text(page_text)
            
            for chunk_idx, chunk in enumerate(chunks):
                documents.append({
                    "text": chunk,
                    "metadata": {
                        "file_name": file_name,
                        "page_label": str(page_idx),
                        "chunk_index": chunk_idx
                    }
                })
        
        logger.info(f"✅ Parsed {len(documents)} chunks from {file_name}")
        return documents
    
    def _parse_with_fallback(
        self, 
        file_path: str, 
        file_name: str
    ) -> List[Dict[str, Any]]:
        """使用 pymupdf (fitz) 解析 PDF"""
        documents = []
        
        # 優先使用 pymupdf
        try:
            import fitz  # pymupdf
            
            logger.info(f"📖 使用 PyMuPDF 解析: {file_path}")
            
            doc = fitz.open(file_path)
            total_pages = len(doc)
            logger.info(f"📖 PDF 共 {total_pages} 頁")
            
            for page_idx in range(total_pages):
                page = doc[page_idx]
                page_text = page.get_text()
                
                logger.info(f"📖 第 {page_idx + 1} 頁: {len(page_text)} 字符")
                
                if not page_text.strip():
                    logger.warning(f"⚠️ 第 {page_idx + 1} 頁沒有文字")
                    continue
                
                # 分塊
                chunks = self._chunk_text(page_text)
                logger.info(f"📖 第 {page_idx + 1} 頁分成 {len(chunks)} 個塊")
                
                for chunk_idx, chunk in enumerate(chunks):
                    if chunk.strip():  # 確保不是空白
                        documents.append({
                            "text": chunk,
                            "metadata": {
                                "file_name": file_name,
                                "page_label": str(page_idx + 1),
                                "chunk_index": chunk_idx
                            }
                        })
            
            doc.close()
            logger.info(f"✅ PyMuPDF 解析完成: {len(documents)} 個文字塊")
            return documents
            
        except ImportError:
            logger.warning("⚠️ PyMuPDF 不可用，嘗試 PyPDF2")
        except Exception as e:
            logger.error(f"❌ PyMuPDF 解析失敗: {e}")
        
        # 備用: PyPDF2
        try:
            import PyPDF2
            
            logger.info(f"📖 使用 PyPDF2 解析: {file_path}")
            
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                total_pages = len(reader.pages)
                logger.info(f"📖 PDF 共 {total_pages} 頁")
                
                for page_idx, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    
                    logger.info(f"📖 第 {page_idx + 1} 頁: {len(page_text) if page_text else 0} 字符")
                    
                    if not page_text or not page_text.strip():
                        logger.warning(f"⚠️ 第 {page_idx + 1} 頁沒有文字")
                        continue
                    
                    chunks = self._chunk_text(page_text)
                    logger.info(f"📖 第 {page_idx + 1} 頁分成 {len(chunks)} 個塊")
                    
                    for chunk_idx, chunk in enumerate(chunks):
                        if chunk.strip():
                            documents.append({
                                "text": chunk,
                                "metadata": {
                                    "file_name": file_name,
                                    "page_label": str(page_idx + 1),
                                    "chunk_index": chunk_idx
                                }
                            })
            
            logger.info(f"✅ PyPDF2 解析完成: {len(documents)} 個文字塊")
            return documents
            
        except ImportError:
            logger.error("❌ PyPDF2 也不可用")
        except Exception as e:
            logger.error(f"❌ PyPDF2 解析失敗: {e}")
        
        return []
    
    def _chunk_text(self, text: str) -> List[str]:
        """將文字分塊"""
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # 嘗試在句子邊界分割
            if end < len(text):
                # 尋找最近的句號或換行
                for sep in ['\n\n', '\n', '。', '.', '！', '!', '？', '?']:
                    last_sep = text.rfind(sep, start, end)
                    if last_sep > start:
                        end = last_sep + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # 下一塊從 overlap 位置開始
            start = end - self.chunk_overlap
            if start < 0:
                start = 0
        
        return chunks


class Indexer:
    """向量索引器"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.qdrant_host = self.config.get("qdrant_host", "localhost")
        self.qdrant_port = self.config.get("qdrant_port", 6333)
        self.collection_name = self.config.get("collection", "rag_knowledge_base")
        self.embedding_model = self.config.get("embedding_model", "text-embedding-3-small")
        
        self.qdrant_client = None
        self.openai_client = None
    
    def _init_clients(self):
        """初始化客戶端"""
        if self.qdrant_client is None:
            from qdrant_client import QdrantClient
            from openai import OpenAI
            from opencode.core.utils import get_env_path
            
            # 強制重新載入 .env（背景任務可能需要）
            load_env()
            
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                env_path = get_env_path()
                logger.error(f"❌ OPENAI_API_KEY 未設置！.env 路徑: {env_path}, 存在: {env_path.exists()}")
                raise ValueError(f"OPENAI_API_KEY 未設置。請確認 {env_path} 檔案存在且包含 OPENAI_API_KEY=sk-xxx")
            
            self.qdrant_client = QdrantClient(
                host=self.qdrant_host,
                port=self.qdrant_port
            )
            self.openai_client = OpenAI(api_key=api_key)
            
            self._ensure_collection()
    
    def _ensure_collection(self):
        """確保 collection 存在"""
        from qdrant_client.models import VectorParams, Distance
        
        try:
            self.qdrant_client.get_collection(self.collection_name)
        except Exception as e:
            logger.info(f"🔧 Collection 不存在，正在建立: {self.collection_name} (原因: {e})")
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=1536,
                    distance=Distance.COSINE
                )
            )
    
    def get_embedding(self, text: str) -> List[float]:
        """取得文字向量"""
        text = text.replace("\n", " ")
        response = self.openai_client.embeddings.create(
            input=[text],
            model=self.embedding_model
        )
        return response.data[0].embedding
    
    def index_documents(self, documents: List[Dict[str, Any]]) -> None:
        """
        將文件索引到 Qdrant
        
        Args:
            documents: 文件列表
        """
        if not documents:
            logger.warning("⚠️ 沒有文件需要索引")
            return
        
        self._init_clients()
        
        from qdrant_client.models import PointStruct
        import uuid
        
        logger.info(f"💾 ====== 開始索引 ======")
        logger.info(f"💾 文件數量: {len(documents)}")
        
        # 記錄第一個文件的結構
        if documents:
            sample = documents[0]
            logger.info(f"💾 文件結構範例: keys={list(sample.keys())}")
            logger.info(f"💾 metadata: {sample.get('metadata', {})}")
        
        points = []
        for i, doc in enumerate(documents):
            text = doc.get("text", "")
            if not text.strip():
                continue
            
            try:
                vector = self.get_embedding(text)
                
                metadata = doc.get("metadata", {})
                payload = {
                    "text": text,
                    **metadata
                }
                
                # 記錄前3個的 payload
                if i < 3:
                    logger.info(f"💾 [{i+1}] payload_keys={list(payload.keys())}, file_name={payload.get('file_name', 'MISSING')}")
                
                points.append(PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload=payload
                ))
                
            except Exception as e:
                logger.error(f"❌ Embedding failed for doc {i}: {e}")
        
        if points:
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"✅ 成功索引 {len(points)} 個文件到 Qdrant")
        else:
            logger.warning("⚠️ 沒有成功生成任何 embedding")


def run_ingestion(file_path: str, config: Optional[Dict[str, Any]] = None) -> None:
    """
    執行文件處理管線
    
    Args:
        file_path: 文件路徑
        config: 配置
    """
    config = config or {}
    
    logger.info(f"🚀 Starting ingestion: {file_path}")
    
    try:
        # 解析
        parser = PDFParser(config.get("parser", {}))
        documents = parser.parse(file_path)
        
        if not documents:
            logger.warning("⚠️ No documents parsed")
            return
        
        # 索引
        indexer = Indexer(config.get("indexer", {}))
        indexer.index_documents(documents)
        
        logger.info("✅ Ingestion complete")
        
    except Exception as e:
        logger.error(f"❌ Ingestion failed: {e}")
        raise


async def process_pdf_to_qdrant(
    file_path: str, 
    original_filename: str = None,
    config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    處理 PDF 並索引到 Qdrant (異步版本)
    
    Args:
        file_path: PDF 檔案路徑
        original_filename: 原始檔名
        config: 配置
        
    Returns:
        處理結果
    """
    import asyncio
    
    config = config or {}
    
    if original_filename is None:
        original_filename = os.path.basename(file_path)
    
    logger.info(f"🚀 Processing: {original_filename}")
    
    try:
        # 解析 PDF
        parser = PDFParser(config.get("parser", {}))
        documents = parser.parse(file_path)
        
        if not documents:
            logger.warning("⚠️ No content extracted from PDF")
            return {"chunks": 0, "error": "No content extracted"}
        
        # 更新檔名到 metadata
        for doc in documents:
            doc["metadata"]["file_name"] = original_filename
        
        # 索引到 Qdrant (在執行緒中執行同步操作)
        indexer = Indexer(config.get("indexer", {}))
        
        # 使用 run_in_executor 避免阻塞
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, indexer.index_documents, documents)
        
        logger.info(f"✅ Processed {len(documents)} chunks from {original_filename}")
        
        return {
            "success": True,
            "filename": original_filename,
            "chunks": len(documents),
            "pages": len(set(d["metadata"].get("page_label") for d in documents))
        }
        
    except Exception as e:
        logger.error(f"❌ Processing failed: {e}")
        raise
