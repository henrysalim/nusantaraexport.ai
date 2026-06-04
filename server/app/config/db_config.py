"""
Database configuration with graceful fallback.
If PostgreSQL is not available, returns mock data.
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "")
AUTH_DATABASE_URL = os.getenv("AUTH_DATABASE_URL", "")

_use_db = False
_use_auth_db = False
_conn_factory = None

try:
    if DATABASE_URL:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        _use_db = True
        logger.info("PostgreSQL configured.")
    else:
        logger.info("DATABASE_URL not set. Using mock DB fallback.")
except ImportError:
    logger.warning("psycopg2 not installed. Using mock DB fallback.")
except Exception as e:
    logger.warning(f"DB config error: {e}. Using mock DB fallback.")

try:
    if AUTH_DATABASE_URL:
        import psycopg2
        _use_auth_db = True
        logger.info("Auth PostgreSQL configured (port 5432).")
    else:
        logger.info("AUTH_DATABASE_URL not set. Auth DB not available.")
except ImportError:
    logger.warning("psycopg2 not installed. Auth DB not available.")
except Exception as e:
    logger.warning(f"Auth DB config error: {e}.")


def get_db_connection():
    if not _use_db:
        return None
    import psycopg2
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def get_auth_db_connection():
    """Get connection to the auth database (nusantaraexport_ai on port 5432)."""
    if not _use_auth_db:
        raise Exception("Auth database not configured. Set AUTH_DATABASE_URL in .env")
    import psycopg2
    conn = psycopg2.connect(AUTH_DATABASE_URL)
    return conn


def execute_query(query, params=None, fetch=False):
    if not _use_db:
        logger.info("Mock DB: query skipped (no PostgreSQL)")
        if fetch:
            return []
        return None

    import psycopg2
    from psycopg2.extras import RealDictCursor
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query, params)
        if fetch:
            result = cur.fetchall()
        else:
            result = None
        conn.commit()
        return result
    finally:
        cur.close()
        conn.close()


def execute_auth_query(query, params=None, fetch=False, fetch_one=False):
    """Execute a query on the auth database."""
    import psycopg2
    from psycopg2.extras import RealDictCursor
    conn = get_auth_db_connection()
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
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()
