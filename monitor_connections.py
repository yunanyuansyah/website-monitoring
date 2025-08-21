#!/usr/bin/env python3
"""
Script untuk monitor koneksi PostgreSQL dan diagnose masalah
"""

import psycopg2
import subprocess
import time
from datetime import datetime

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "sensor_db",
    "user": "postgres",
    "password": "radiohead123",
    "port": "5432"
}

def get_connection_count():
    """Get current connection count from netstat"""
    try:
        result = subprocess.run(
            "netstat -an | findstr :5432 | findstr ESTABLISHED", 
            shell=True, 
            capture_output=True, 
            text=True
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            return len([line for line in lines if line.strip()])
        return 0
    except:
        return 0

def get_postgresql_processes():
    """Get PostgreSQL process count"""
    try:
        result = subprocess.run(
            "tasklist | findstr postgres", 
            shell=True, 
            capture_output=True, 
            text=True
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            return len([line for line in lines if line.strip()])
        return 0
    except:
        return 0

def test_database_connection():
    """Test if we can connect to database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        return True, version[0]
    except Exception as e:
        return False, str(e)

def monitor_connections():
    """Monitor connections continuously"""
    print("🔍 PostgreSQL Connection Monitor")
    print("=" * 50)
    print("Press Ctrl+C to stop monitoring")
    print()
    
    try:
        while True:
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            # Get connection count
            conn_count = get_connection_count()
            
            # Get process count
            process_count = get_postgresql_processes()
            
            # Test database connection
            can_connect, connection_info = test_database_connection()
            
            # Display status
            print(f"[{timestamp}] ", end="")
            print(f"Connections: {conn_count:3d} | ", end="")
            print(f"Processes: {process_count:3d} | ", end="")
            
            if can_connect:
                print(f"✅ Database: OK")
            else:
                print(f"❌ Database: {connection_info}")
            
            # Wait before next check
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Monitoring stopped by user")
    except Exception as e:
        print(f"\n❌ Error during monitoring: {e}")

def show_current_status():
    """Show current connection status"""
    print("📊 Current PostgreSQL Status")
    print("=" * 50)
    
    # Connection count
    conn_count = get_connection_count()
    print(f"🔌 Active Connections: {conn_count}")
    
    # Process count
    process_count = get_postgresql_processes()
    print(f"🔄 PostgreSQL Processes: {process_count}")
    
    # Database connection test
    can_connect, connection_info = test_database_connection()
    if can_connect:
        print(f"✅ Database Connection: OK")
        print(f"📊 PostgreSQL Version: {connection_info}")
    else:
        print(f"❌ Database Connection: FAILED")
        print(f"   Error: {connection_info}")
    
    # Recommendations
    print("\n📋 Recommendations:")
    if conn_count > 100:
        print("   ⚠️  Too many connections! Restart PostgreSQL service")
    elif conn_count > 50:
        print("   ⚠️  High connection count. Consider restarting")
    else:
        print("   ✅ Connection count looks normal")
    
    if not can_connect:
        print("   🔧 Database connection failed. Try restarting PostgreSQL")
        print("   📖 Manual steps:")
        print("      1. Open Services (services.msc)")
        print("      2. Find 'postgresql-x64-17'")
        print("      3. Right-click → Restart")

def main():
    """Main function"""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "monitor":
        monitor_connections()
    else:
        show_current_status()

if __name__ == "__main__":
    main()
