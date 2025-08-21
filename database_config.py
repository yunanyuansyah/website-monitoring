#!/usr/bin/env python3
"""
Database configuration with connection pooling
"""

import psycopg2
from psycopg2 import pool
import contextlib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "sensor_db",
    "user": "postgres",
    "password": "radiohead123",
    "port": "5432"
}

# Connection pool configuration
POOL_CONFIG = {
    "minconn": 1,      # Minimum connections in pool
    "maxconn": 10,     # Maximum connections in pool
    "host": DB_CONFIG["host"],
    "database": DB_CONFIG["database"],
    "user": DB_CONFIG["user"],
    "password": DB_CONFIG["password"],
    "port": DB_CONFIG["port"]
}

# Global connection pool
_connection_pool = None

def get_connection_pool():
    """Get or create the connection pool"""
    global _connection_pool
    
    if _connection_pool is None:
        try:
            _connection_pool = pool.SimpleConnectionPool(**POOL_CONFIG)
            logger.info("Connection pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create connection pool: {e}")
            raise
    
    return _connection_pool

def close_connection_pool():
    """Close the connection pool"""
    global _connection_pool
    
    if _connection_pool:
        _connection_pool.closeall()
        _connection_pool = None
        logger.info("Connection pool closed")

@contextlib.contextmanager
def get_db_connection():
    """Context manager for database connection from pool"""
    conn = None
    pool = get_connection_pool()
    
    try:
        conn = pool.getconn()
        yield conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            pool.putconn(conn)

def test_connection():
    """Test database connection"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            cursor.close()
            logger.info(f"Database connection successful: {version[0]}")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

def get_connection_stats():
    """Get connection pool statistics"""
    pool = get_connection_pool()
    if pool:
        return {
            "minconn": pool.minconn,
            "maxconn": pool.maxconn,
            "current_connections": len(pool._used) if hasattr(pool, '_used') else 0,
            "available_connections": len(pool._free) if hasattr(pool, '_free') else 0
        }
    return None

# Cleanup on module unload
import atexit
atexit.register(close_connection_pool)

if __name__ == "__main__":
    # Test the connection
    print("🔌 Testing database connection...")
    if test_connection():
        print("✅ Connection successful!")
        
        stats = get_connection_stats()
        if stats:
            print(f"📊 Connection pool stats: {stats}")
    else:
        print("❌ Connection failed!")
    
    # Clean up
    close_connection_pool()
