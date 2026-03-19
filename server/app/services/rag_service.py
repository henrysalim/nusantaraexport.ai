from langchain_classic.chains import RetrievalQA
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings # Temporary, will pivot to Cendol/IndoNLP embeddings in Step 4
from .vector_store import CHROMA_DB_DIR
import os

# Note: Integration with Cendol NLP API will happen in Step 4.
# For now, we use a basic wrapper structure.

class CendolLLM:
    """Placeholder for Cendol NLP API Integration"""
    def __init__(self, api_key: str):
        self.api_key = api_key

    def generate(self, prompt: str):
        # This will be replaced by actual API call to Cendol NLP
        return f"Jawaban berbasis RAG (Placeholder): {prompt[:50]}..."

def get_rag_chain():
    """
    Returns a LangChain RAG pipeline.
    Currently using Chroma as the vector store.
    """
    # Embeddings will be swapped with Cendol/IndoNLP in Step 4
    embeddings = OpenAIEmbeddings() 
    
    vectorstore = Chroma(
        persist_directory=CHROMA_DB_DIR, 
        embedding_function=embeddings,
        collection_name="regulations"
    )
    
    # We will build a custom LLM wrapper for Cendol NLP in the next step
    # For now, this is the structural foundation.
    return vectorstore.as_retriever(search_kwargs={"k": 3})

def format_rag_prompt(query: str, context: str):
    return f"""
Anda adalah asisten ahli ekspor NusantaraExport.AI. 
Gunakan konteks regulasi berikut untuk menjawab pertanyaan pengguna dengan akurat (tidak menebak).
Jika jawaban tidak ada di konteks, katakan bahwa Anda tidak tahu.

KONTEKS REGULASI:
{context}

PERTANYAAN:
{query}

JAWABAN:
"""
