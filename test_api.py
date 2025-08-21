#!/usr/bin/env python3
"""
Test script untuk memverifikasi API sensor monitoring
Memastikan data bisa diambil tanpa batasan limit
"""

import requests
import json
from datetime import datetime

# API Configuration
API_BASE_URL = "http://localhost:8000"

def test_api_endpoints():
    """Test semua endpoint API"""
    print("🧪 Testing Sensor Monitoring API...")
    print("=" * 50)
    
    # Test 1: Root endpoint
    print("1. Testing root endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/")
        if response.status_code == 200:
            print("✅ Root endpoint OK")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
    
    print()
    
    # Test 2: Get sensor data without limit
    print("2. Testing sensor data endpoint (no limit)...")
    try:
        response = requests.get(f"{API_BASE_URL}/sensor-data")
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('data', []))
            print(f"✅ Sensor data endpoint OK")
            print(f"   Total data retrieved: {count}")
            
            if count > 100:
                print(f"🎉 SUCCESS: Data retrieved exceeds 100 rows! ({count} rows)")
            elif count == 100:
                print(f"⚠️  WARNING: Still limited to 100 rows")
            else:
                print(f"ℹ️  Info: Retrieved {count} rows")
                
            # Show first and last few records
            if data.get('data'):
                first_record = data['data'][0]
                last_record = data['data'][-1]
                print(f"   First record ID: {first_record.get('id')}")
                print(f"   Last record ID: {last_record.get('id')}")
                
        else:
            print(f"❌ Sensor data endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Sensor data endpoint error: {e}")
    
    print()
    
    # Test 3: Get sensor data with specific limit
    print("3. Testing sensor data endpoint (limit 50)...")
    try:
        response = requests.get(f"{API_BASE_URL}/sensor-data?limit=50")
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('data', []))
            print(f"✅ Sensor data endpoint with limit OK")
            print(f"   Data retrieved: {count} rows")
            
            if count <= 50:
                print(f"✅ Limit working correctly: {count} <= 50")
            else:
                print(f"❌ Limit not working: {count} > 50")
                
        else:
            print(f"❌ Sensor data endpoint with limit failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Sensor data endpoint with limit error: {e}")
    
    print()
    
    # Test 4: Get sensor stats
    print("4. Testing sensor stats endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/sensor-stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Sensor stats endpoint OK")
            print(f"   Total sensors: {stats.get('total_sensors')}")
            print(f"   Total data: {stats.get('total_data')}")
            print(f"   Today's data: {stats.get('today_data')}")
            print(f"   System status: {stats.get('system_status')}")
            
            # Verify stats
            if stats.get('total_data', 0) > 100:
                print(f"🎉 SUCCESS: Database contains more than 100 records!")
            else:
                print(f"ℹ️  Info: Database contains {stats.get('total_data', 0)} records")
                
        else:
            print(f"❌ Sensor stats endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Sensor stats endpoint error: {e}")
    
    print()
    
    # Test 5: Test with large limit
    print("5. Testing sensor data endpoint (large limit)...")
    try:
        response = requests.get(f"{API_BASE_URL}/sensor-data?limit=1000")
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('data', []))
            print(f"✅ Large limit test OK")
            print(f"   Data retrieved: {count} rows")
            
            if count > 100:
                print(f"🎉 SUCCESS: Large limit working! Retrieved {count} rows")
            else:
                print(f"⚠️  WARNING: Still limited to {count} rows")
                
        else:
            print(f"❌ Large limit test failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Large limit test error: {e}")

def test_database_connection():
    """Test koneksi database melalui API"""
    print("\n" + "=" * 50)
    print("🔌 Testing Database Connection...")
    
    try:
        # Test dengan endpoint yang membutuhkan database
        response = requests.get(f"{API_BASE_URL}/sensor-stats")
        if response.status_code == 200:
            print("✅ Database connection OK")
            stats = response.json()
            print(f"   Database contains: {stats.get('total_data', 0)} total records")
            print(f"   Unique sensors: {stats.get('total_sensors', 0)}")
        else:
            print(f"❌ Database connection failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Database connection error: {e}")

def main():
    """Main function"""
    print("🚀 Sensor Monitoring API Test Suite")
    print(f"📡 Testing API at: {API_BASE_URL}")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        test_api_endpoints()
        test_database_connection()
        
        print("\n" + "=" * 50)
        print("🏁 Test completed!")
        print("\n📋 Summary:")
        print("   - Jika data > 100: ✅ Limit berhasil dihapus")
        print("   - Jika data = 100: ⚠️  Masih ada limit")
        print("   - Jika error: ❌ Ada masalah dengan API/database")
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")

if __name__ == "__main__":
    main()
