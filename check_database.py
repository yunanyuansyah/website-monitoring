#!/usr/bin/env python3
"""
Script untuk memeriksa data database PostgreSQL secara langsung
Memverifikasi apakah data sensor tersedia dan sesuai
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import json
import contextlib

# Database configuration (sesuaikan dengan konfigurasi Anda)
DB_CONFIG = {
    "host": "localhost",
    "database": "sensor_db",
    "user": "postgres",
    "password": "radiohead123",
    "port": "5432"
}

@contextlib.contextmanager
def get_db_connection():
    """Context manager untuk database connection yang otomatis close"""
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        yield conn
    except Exception as e:
        print(f"Database connection error: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

def check_database_connection():
    """Test koneksi database"""
    print("🔌 Testing Database Connection...")
    print("=" * 50)
    
    try:
        with get_db_connection() as conn:
            print("✅ Database connection successful!")
            
            # Test basic query
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"📊 PostgreSQL Version: {version[0]}")
            cursor.close()
            
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def check_sensor_table():
    """Periksa struktur dan data tabel sensor"""
    print("\n📋 Checking Sensor Table...")
    print("=" * 50)
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Check table structure
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'sensor'
                ORDER BY ordinal_position;
            """)
            
            columns = cursor.fetchall()
            print("🏗️ Table Structure:")
            for col in columns:
                print(f"   {col['column_name']}: {col['data_type']} ({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'})")
            
            # Check total records
            cursor.execute("SELECT COUNT(*) as total FROM sensor")
            total_count = cursor.fetchone()['total']
            print(f"\n📊 Total Records: {total_count}")
            
            if total_count == 0:
                print("⚠️  WARNING: No data in sensor table!")
                return False
            
            # Get sample data
            cursor.execute("""
                SELECT id, nama_sensor, tanggal, nilai, waktu
                FROM sensor
                ORDER BY waktu DESC
                LIMIT 10
            """)
            
            sample_data = cursor.fetchall()
            print(f"\n📝 Sample Data (Latest 10 records):")
            for i, record in enumerate(sample_data, 1):
                print(f"   {i}. ID: {record['id']}, Sensor: {record['nama_sensor']}, "
                      f"Nilai: {record['nilai']}, Waktu: {record['waktu']}")
            
            # Get unique sensors
            cursor.execute("SELECT DISTINCT nama_sensor FROM sensor")
            unique_sensors = [row['nama_sensor'] for row in cursor.fetchall()]
            print(f"\n🔍 Unique Sensors: {unique_sensors}")
            
            # Get data count by sensor
            cursor.execute("""
                SELECT nama_sensor, COUNT(*) as count
                FROM sensor
                GROUP BY nama_sensor
                ORDER BY count DESC
            """)
            
            sensor_counts = cursor.fetchall()
            print(f"\n📈 Data Count by Sensor:")
            for sensor in sensor_counts:
                print(f"   {sensor['nama_sensor']}: {sensor['count']} records")
            
            cursor.close()
            
        return True
        
    except Exception as e:
        print(f"❌ Error checking sensor table: {e}")
        return False

def check_recent_data():
    """Periksa data terbaru untuk chart"""
    print("\n📊 Checking Recent Data for Chart...")
    print("=" * 50)
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get latest 50 records for chart
            cursor.execute("""
                SELECT id, nama_sensor, tanggal, nilai, waktu
                FROM sensor
                ORDER BY waktu DESC
                LIMIT 50
            """)
            
            recent_data = cursor.fetchall()
            print(f"📈 Recent Data Count: {len(recent_data)} records")
            
            if recent_data:
                print(f"🕐 Time Range:")
                print(f"   Earliest: {recent_data[-1]['waktu']}")
                print(f"   Latest: {recent_data[0]['waktu']}")
                
                print(f"\n📊 Value Range:")
                values = [record['nilai'] for record in recent_data]
                print(f"   Min: {min(values):.2f}")
                print(f"   Max: {max(values):.2f}")
                print(f"   Avg: {sum(values)/len(values):.2f}")
                
                # Show first and last few records
                print(f"\n📝 First 3 records:")
                for i, record in enumerate(recent_data[:3]):
                    print(f"   {i+1}. {record['waktu']} - {record['nama_sensor']}: {record['nilai']}")
                
                print(f"\n📝 Last 3 records:")
                for i, record in enumerate(recent_data[-3:]):
                    print(f"   {len(recent_data)-2+i}. {record['waktu']} - {record['nama_sensor']}: {record['nilai']}")
            
            cursor.close()
            
        return True
        
    except Exception as e:
        print(f"❌ Error checking recent data: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints untuk memastikan data bisa diakses"""
    print("\n🌐 Testing API Endpoints...")
    print("=" * 50)
    
    import requests
    
    base_url = "http://localhost:8000"
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Root endpoint: OK")
        else:
            print(f"❌ Root endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
    
    # Test sensor data endpoint
    try:
        response = requests.get(f"{base_url}/sensor-data")
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('data', []))
            print(f"✅ Sensor data endpoint: OK ({count} records)")
        else:
            print(f"❌ Sensor data endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Sensor data endpoint error: {e}")
    
    # Test sensor stats endpoint
    try:
        response = requests.get(f"{base_url}/sensor-stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Sensor stats endpoint: OK")
            print(f"   Total sensors: {stats.get('total_sensors')}")
            print(f"   Total data: {stats.get('total_data')}")
            print(f"   Latest data count: {len(stats.get('latest_data', []))}")
        else:
            print(f"❌ Sensor stats endpoint: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Sensor stats endpoint error: {e}")

def main():
    """Main function"""
    print("🔍 PostgreSQL Database Integration Check")
    print("=" * 60)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check database connection
    if not check_database_connection():
        print("\n❌ Cannot proceed without database connection!")
        return
    
    # Check sensor table
    if not check_sensor_table():
        print("\n❌ Sensor table has issues!")
        return
    
    # Check recent data
    if not check_recent_data():
        print("\n❌ Recent data has issues!")
        return
    
    # Test API endpoints
    test_api_endpoints()
    
    print("\n" + "=" * 60)
    print("🏁 Database check completed!")
    print("\n📋 Summary:")
    print("   - Jika semua test ✅: Database terintegrasi dengan baik")
    print("   - Jika ada ❌: Ada masalah yang perlu diperbaiki")
    print("   - Pastikan API backend berjalan sebelum test endpoint")

if __name__ == "__main__":
    main()
