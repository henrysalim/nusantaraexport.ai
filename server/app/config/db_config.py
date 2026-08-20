"""
Database configuration with self-healing fallback & robust URI parsing.
Supports PostgreSQL (Docker/Supabase/Local).
"""
import os
import logging
from urllib.parse import urlparse, unquote
from dotenv import load_dotenv

load_dotenv(override=True)
logger = logging.getLogger(__name__)

_db_host = os.getenv("DB_HOST", "127.0.0.1")
_db_port = os.getenv("DB_PORT", "5432")
_db_user = os.getenv("DB_USER", "nusantaraexport")
_db_pass = os.getenv("DB_PASSWORD", "Nusantar43xport!")
_db_name = os.getenv("DB_NAME", "nusantaraexport_ai")

_default_url = f"postgresql://{_db_user}:{_db_pass}@{_db_host}:{_db_port}/{_db_name}"

_raw_db_url = os.getenv("DATABASE_URL", "").strip()
_raw_auth_url = os.getenv("AUTH_DATABASE_URL", "").strip()

def _is_valid_db_url(url: str) -> bool:
    if not url:
        return False
    placeholders = ["[host]", "[password]", "your_host", "your_password", "localhost:5432/postgres_dummy"]
    if any(p in url for p in placeholders):
        return False
    return True

DATABASE_URL = _raw_db_url if _is_valid_db_url(_raw_db_url) else _default_url
AUTH_DATABASE_URL = _raw_auth_url if _is_valid_db_url(_raw_auth_url) else DATABASE_URL

_use_db = _is_valid_db_url(DATABASE_URL)
_use_auth_db = _is_valid_db_url(AUTH_DATABASE_URL)


def _connect_pg(url: str):
    """Connect to PostgreSQL using direct URI or parsed parameters with auto fallback."""
    import psycopg2
    if url and ("postgresql://" in url or "postgres://" in url):
        try:
            return psycopg2.connect(url, connect_timeout=8)
        except Exception as err:
            # If IPv6 failed locally ("Cannot assign requested address" or DNS timeout), try pooler fallback
            if "Cannot assign requested address" in str(err) or "timeout" in str(err):
                logger.info("Retrying connection via fallback pooler mode...")
                fallback_url = url.replace("db.jkykqcgclvxxsfryhryh.supabase.co:5432", "aws-0-ap-southeast-1.pooler.supabase.com:6543").replace("user=postgres", "user=postgres.jkykqcgclvxxsfryhryh")
                try:
                    return psycopg2.connect(fallback_url, connect_timeout=8)
                except Exception:
                    pass
            raise err
    
    return psycopg2.connect(
        dbname=_db_name,
        user=_db_user,
        password=_db_pass,
        host=_db_host,
        port=int(_db_port),
        connect_timeout=8
    )


def get_db_connection():
    global _use_db
    if not _use_db:
        return None
    try:
        return _connect_pg(DATABASE_URL)
    except Exception as e:
        logger.warning(f"⚠️ Main DB connection failed: {e}. Switching to fallback mode.")
        _use_db = False
        return None


def get_auth_db_connection():
    """Get connection to auth database."""
    global _use_auth_db
    if not _use_auth_db:
        return None
    try:
        return _connect_pg(AUTH_DATABASE_URL)
    except Exception as e:
        logger.warning(f"⚠️ Auth DB connection failed: {e}. Switching to fallback mode.")
        _use_auth_db = False
        return None


def execute_query(query, params=None, fetch=False):
    conn = get_db_connection()
    if not conn:
        logger.info("Fallback DB: query skipped (PostgreSQL offline)")
        return [] if fetch else None

    import psycopg2
    from psycopg2.extras import RealDictCursor
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query, params)
        result = cur.fetchall() if fetch else None
        conn.commit()
        return result
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"DB query error: {e}")
        return [] if fetch else None
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def execute_auth_query(query, params=None, fetch=False, fetch_one=False):
    """Execute a query on auth database with fallback.
    
    If the auth DB is offline (no connection), returns mock data so the app
    can run in degraded mode. If connected but the query fails, raises the
    exception so the caller can handle it properly.
    """
    conn = get_auth_db_connection()
    if not conn:
        # DB is truly offline — return mock data so app can still run
        logger.info("Fallback Auth DB: returning mock response (PostgreSQL offline)")
        if fetch_one:
            email = params[0] if params and len(params) > 0 else "demo@nusantaraexport.ai"
            return {
                "id": "00000000-0000-0000-0000-000000000001",
                "full_name": "Demo User (Offline Mode)",
                "email": str(email),
                "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW",
                "phone": "+6281234567890",
                "business_name": "Koperasi Eksportir Nusantara",
                "province": "DKI Jakarta",
                "products": "Kopi, Kakao, Batik",
                "export_destinations": "Jepang, Jerman",
                "created_at": "2026-08-19 12:00:00",
                "updated_at": "2026-08-19 12:00:00",
            }
        elif fetch:
            return []
        return {"id": "00000000-0000-0000-0000-000000000001"}

    import psycopg2
    from psycopg2.extras import RealDictCursor
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query, params)
        if fetch_one:
            result = cur.fetchone()
        elif fetch:
            result = cur.fetchall()
        else:
            result = None
        conn.commit()
        return result
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Auth DB query error: {e}")
        # Re-raise so callers (e.g. update_profile) get a proper error
        # instead of silently returning stale/mock data
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

