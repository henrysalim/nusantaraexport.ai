import redis
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Redis connection pool
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def get_redis():
    return redis_client

def set_cache(key: str, value: str, expire: int = 3600):
    """Set cache with 1 hour default expiration"""
    redis_client.set(key, value, ex=expire)

def get_cache(key: str):
    """Get value from cache"""
    return redis_client.get(key)
