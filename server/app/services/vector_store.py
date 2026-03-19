import chromadb
from chromadb.config import Settings
import os

CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_db")

# Initialize ChromaDB Persistent Client
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

def get_chroma_client():
    return chroma_client

def get_or_create_collection(name: str = "regulations"):
    return chroma_client.get_or_create_collection(name=name)

def add_documents(collection, documents: list, metadatas: list, ids: list):
    """Add documents to a ChromaDB collection"""
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )

def query_documents(collection, query_texts: list, n_results: int = 3):
    """Query ChromaDB for relevant context"""
    return collection.query(
        query_texts=query_texts,
        n_results=n_results
    )
