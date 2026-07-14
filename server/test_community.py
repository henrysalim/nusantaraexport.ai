"""
Manual integration test script for Community Forum API.
Runs against the FastAPI application instance using TestClient.
"""
from fastapi.testclient import TestClient
from app.main import app
from app.config.db_config import execute_auth_query

client = TestClient(app)

def run_tests():
    print("🚀 Starting Community Forum Tests...\n")

    # 1. Fetch Categories
    print("Testing GET /api/community/categories...")
    response = client.get("/api/community/categories")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    categories = response.json()
    assert len(categories) > 0, "Expected at least 1 category"
    print(f"✅ Found {len(categories)} categories. Example: {categories[0]['name']} (slug: {categories[0]['slug']})\n")

    # 2. Fetch Posts
    print("Testing GET /api/community/posts (Public)...")
    response = client.get("/api/community/posts")
    assert response.status_code == 200
    posts = response.json()
    print(f"✅ Fetched {len(posts)} posts.\n")

    # 3. Try to create post without login
    print("Testing POST /api/community/posts (Without JWT Auth)...")
    response = client.post("/api/community/posts", json={
        "category_id": 1,
        "title": "Judul Diskusi Tanpa Login",
        "content": "Ini konten diskusi tanpa otentikasi."
    })
    # Should be 401 Unauthorized
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    print("✅ Successfully blocked unauthorized post creation.\n")

    # 4. Try to create post with invalid JWT
    print("Testing POST /api/community/posts (With Invalid JWT)...")
    headers = {"Authorization": "Bearer invalidtoken123"}
    response = client.post("/api/community/posts", json={
        "category_id": 1,
        "title": "Judul Diskusi Salah Token",
        "content": "Ini konten diskusi dengan token salah."
    }, headers=headers)
    assert response.status_code == 401
    print("✅ Successfully blocked post creation with invalid token.\n")

    print("🎉 Basic Community API Tests Completed Successfully!")

if __name__ == "__main__":
    run_tests()
