"""
Redis cache with graceful fallback to in-memory dict.
Ensures the server never crashes if Redis is unavailable.
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "")

# Try to connect to Redis, fall back to in-memory cache
_use_redis = False
_memory_cache = {}

try:
    if REDIS_URL:
        import redis
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        redis_client.ping()  # Test connection
        _use_redis = True
        logger.info("Redis connected successfully.")
    else:
        logger.info("REDIS_URL not set. Using in-memory cache fallback.")
except Exception as e:
    logger.warning(f"Redis unavailable ({e}). Using in-memory cache fallback.")
    redis_client = None


def get_redis():
    if _use_redis and redis_client:
        return redis_client
    return None


def set_cache(key: str, value: str, expire: int = 3600):
    """Set cache with 1 hour default expiration"""
    if _use_redis and redis_client:
        try:
            redis_client.set(key, value, ex=expire)
            return
        except Exception:
            pass
    _memory_cache[key] = value


def get_cache(key: str):
    """Get value from cache"""
    if _use_redis and redis_client:
        try:
            return redis_client.get(key)
        except Exception:
            pass
    return _memory_cache.get(key)
