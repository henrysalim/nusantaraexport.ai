from app.services.vector_store import get_or_create_collection, query_documents
import sys

def test_rag_query(query: str):
    """Test ChromaDB retrieval for a given query"""
    collection = get_or_create_collection("regulations")
    results = query_documents(collection, [query], n_results=2)
    
    print(f"\nQUERY: {query}")
    print("-" * 30)
    for i, doc in enumerate(results['documents'][0]):
        print(f"Result {i+1}: {doc}")
        print(f"Source: {results['metadatas'][0][i]['source']}")
        print("-" * 10)

if __name__ == "__main__":
    test_query = sys.argv[1] if len(sys.argv) > 1 else "Bagaimana syarat ekspor kopi?"
    test_rag_query(test_query)
