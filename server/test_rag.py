from app.services.vector_store import query_regulations
import sys

def test_rag_query(query: str):
    """Test retrieval for a given query"""
    result = query_regulations(query, n_results=2)
    print(f"\nQUERY: {query}")
    print("-" * 30)
    print(result)

if __name__ == "__main__":
    test_query = sys.argv[1] if len(sys.argv) > 1 else "Bagaimana syarat ekspor kopi?"
    test_rag_query(test_query)
