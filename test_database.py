#!/usr/bin/env python3
"""
Test script to verify database connectivity and table structure
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "sensor_db",
    "user": "postgres",
    "password": "radiohead123",
    "port": "5432"
}

def test_connection():
    """Test basic database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        print(f"✅ Database connection successful: {version[0]}")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def check_tables():
    """Check if required tables exist"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if tables exist
        tables = ['op', 'sensor', 'transaksi_op', 'acuan_baku']
        existing_tables = []
        
        for table in tables:
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = %s
                );
            """, (table,))
            exists = cursor.fetchone()[0]
            if exists:
                existing_tables.append(table)
                print(f"✅ Table '{table}' exists")
            else:
                print(f"❌ Table '{table}' does not exist")
        
        cursor.close()
        conn.close()
        
        return existing_tables
    except Exception as e:
        print(f"❌ Error checking tables: {e}")
        return []

def test_login():
    """Test login functionality with sample data"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Test admin login
        email = "admin@sensor.com"
        password = "admin123"
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        query = """
        SELECT id, name, email, status
        FROM op
        WHERE email = %s AND password = %s
        """
        
        cursor.execute(query, (email, hashed_password))
        operator = cursor.fetchone()
        
        if operator:
            print(f"✅ Login successful for {operator['name']} ({operator['email']})")
        else:
            print(f"❌ Login failed for {email}")
        
        cursor.close()
        conn.close()
        
        return operator is not None
    except Exception as e:
        print(f"❌ Error testing login: {e}")
        return False

def check_sample_data():
    """Check if sample data exists"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check operators
        cursor.execute("SELECT COUNT(*) as count FROM op")
        op_count = cursor.fetchone()['count']
        print(f"📊 Operators in database: {op_count}")
        
        # Check acuan baku
        cursor.execute("SELECT COUNT(*) as count FROM acuan_baku")
        acuan_count = cursor.fetchone()['count']
        print(f"📊 Acuan baku in database: {acuan_count}")
        
        # Check sensors
        cursor.execute("SELECT COUNT(*) as count FROM sensor")
        sensor_count = cursor.fetchone()['count']
        print(f"📊 Sensor data in database: {sensor_count}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking sample data: {e}")

if __name__ == "__main__":
    print("🔌 Testing Database Connection and Structure")
    print("=" * 50)
    
    # Test connection
    if test_connection():
        print()
        
        # Check tables
        print("📋 Checking Database Tables")
        print("-" * 30)
        existing_tables = check_tables()
        print()
        
        # Check sample data
        print("📊 Checking Sample Data")
        print("-" * 30)
        check_sample_data()
        print()
        
        # Test login
        print("🔐 Testing Login Functionality")
        print("-" * 30)
        test_login()
        print()
        
        if len(existing_tables) == 4:
            print("🎉 All tests passed! Database is ready.")
        else:
            print("⚠️  Some tables are missing. Please run the database setup script.")
    else:
        print("❌ Cannot proceed without database connection.")
