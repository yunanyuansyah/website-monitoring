#!/usr/bin/env python3
"""
Check actual operator data in database
"""

import psycopg2
from psycopg2.extras import RealDictCursor

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "sensor_db",
    "user": "postgres",
    "password": "radiohead123",
    "port": "5432"
}

def check_operators():
    """Check what operators exist in the database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get all operators
        cursor.execute("SELECT id, name, email, password, telp, status FROM op ORDER BY id")
        operators = cursor.fetchall()
        
        print(f"📊 Found {len(operators)} operators:")
        print("-" * 50)
        
        for op in operators:
            print(f"ID: {op['id']}")
            print(f"Name: {op['name']}")
            print(f"Email: {op['email']}")
            print(f"Password: {op['password']}")
            print(f"Password length: {len(op['password'])}")
            print(f"Telp: {op['telp']}")
            print(f"Status: {op['status']}")
            print("-" * 30)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking operators: {e}")

if __name__ == "__main__":
    check_operators()
