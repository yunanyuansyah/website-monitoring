#!/usr/bin/env python3
"""
Script untuk restart PostgreSQL dan clear connection issues
"""

import subprocess
import time
import psycopg2
import sys

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "sensor_db",
    "user": "postgres",
    "password": "radiohead123",
    "port": "5432"
}

def run_command(command):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_postgresql_status():
    """Check if PostgreSQL is running"""
    print("🔍 Checking PostgreSQL status...")
    
    # Check if postgres processes are running
    success, stdout, stderr = run_command("tasklist | findstr postgres")
    if success and "postgres.exe" in stdout:
        print("✅ PostgreSQL processes are running")
        return True
    else:
        print("❌ No PostgreSQL processes found")
        return False

def restart_postgresql_service():
    """Try to restart PostgreSQL service"""
    print("\n🔄 Attempting to restart PostgreSQL service...")
    
    # Try to stop the service
    print("   Stopping PostgreSQL service...")
    success, stdout, stderr = run_command("net stop postgresql-x64-17")
    if success:
        print("   ✅ PostgreSQL service stopped")
    else:
        print(f"   ⚠️  Could not stop service: {stderr}")
    
    # Wait a moment
    print("   Waiting 5 seconds...")
    time.sleep(5)
    
    # Try to start the service
    print("   Starting PostgreSQL service...")
    success, stdout, stderr = run_command("net start postgresql-x64-17")
    if success:
        print("   ✅ PostgreSQL service started")
        return True
    else:
        print(f"   ❌ Could not start service: {stderr}")
        return False

def test_database_connection():
    """Test database connection"""
    print("\n🔌 Testing database connection...")
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        
        print(f"✅ Database connection successful!")
        print(f"📊 PostgreSQL Version: {version[0]}")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def kill_postgresql_processes():
    """Try to kill PostgreSQL processes forcefully"""
    print("\n💀 Attempting to kill PostgreSQL processes...")
    
    # Try to kill all postgres processes
    success, stdout, stderr = run_command("taskkill /F /IM postgres.exe")
    if success:
        print("✅ PostgreSQL processes killed")
        return True
    else:
        print(f"⚠️  Some processes could not be killed: {stderr}")
        return False

def main():
    """Main function"""
    print("🚀 PostgreSQL Connection Issue Resolver")
    print("=" * 50)
    
    # Check current status
    if check_postgresql_status():
        print(f"\n📊 Current PostgreSQL status: RUNNING")
        
        # Test connection
        if test_database_connection():
            print("\n🎉 PostgreSQL is working correctly!")
            return
        
        print("\n⚠️  PostgreSQL is running but connection failed")
        print("   This suggests a configuration or connection limit issue")
    
    # Try to restart the service
    print("\n" + "=" * 50)
    print("🔄 STEP 1: Attempting service restart...")
    
    if restart_postgresql_service():
        print("\n⏳ Waiting for service to fully start...")
        time.sleep(10)
        
        if test_database_connection():
            print("\n🎉 PostgreSQL restarted successfully!")
            return
    
    # If service restart failed, try killing processes
    print("\n" + "=" * 50)
    print("💀 STEP 2: Attempting process kill...")
    
    if kill_postgresql_processes():
        print("\n⏳ Waiting for processes to fully terminate...")
        time.sleep(5)
        
        # Try to start service again
        if restart_postgresql_service():
            print("\n⏳ Waiting for service to fully start...")
            time.sleep(10)
            
            if test_database_connection():
                print("\n🎉 PostgreSQL recovered successfully!")
                return
    
    # Final recommendations
    print("\n" + "=" * 50)
    print("❌ Automatic recovery failed")
    print("\n📋 Manual steps to try:")
    print("   1. Open Services (services.msc)")
    print("   2. Find 'postgresql-x64-17' service")
    print("   3. Right-click and select 'Restart'")
    print("   4. Wait for service to fully start")
    print("   5. Try connecting again")
    print("\n🔧 Alternative solutions:")
    print("   - Check PostgreSQL logs in data directory")
    print("   - Verify max_connections setting in postgresql.conf")
    print("   - Restart your computer")
    print("   - Check if other applications are using port 5432")

if __name__ == "__main__":
    main()
