#!/usr/bin/env python3
"""
Fix existing unhashed passwords in the database
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

def hash_password(password: str) -> str:
    """Hash password menggunakan SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def fix_passwords():
    """Fix unhashed passwords in the database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get all operators
        cursor.execute("SELECT id, name, email, password FROM op ORDER BY id")
        operators = cursor.fetchall()
        
        print(f"📊 Found {len(operators)} operators to check:")
        print("-" * 50)
        
        updated_count = 0
        
        for op in operators:
            password = op['password']
            password_length = len(password)
            
            print(f"ID: {op['id']} - {op['name']} ({op['email']})")
            print(f"  Current password: {password}")
            print(f"  Password length: {password_length}")
            
            # Check if password is already hashed (SHA-256 hash is 64 characters)
            if password_length == 64 and all(c in '0123456789abcdef' for c in password.lower()):
                print(f"  ✅ Password already hashed (SHA-256)")
            else:
                # Password is not hashed, hash it
                hashed_password = hash_password(password)
                print(f"  🔒 Hashing password: {hashed_password}")
                
                # Update the password in database
                update_query = "UPDATE op SET password = %s WHERE id = %s"
                cursor.execute(update_query, (hashed_password, op['id']))
                updated_count += 1
                print(f"  ✅ Password updated")
            
            print()
        
        # Commit changes
        if updated_count > 0:
            conn.commit()
            print(f"🎉 Successfully updated {updated_count} passwords!")
        else:
            print("✅ All passwords are already properly hashed!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error fixing passwords: {e}")

def test_login_after_fix():
    """Test login functionality after fixing passwords"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Test admin login
        email = "admin@sensor.com"
        password = "admin123"
        hashed_password = hash_password(password)
        
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

if __name__ == "__main__":
    print("🔒 Fixing Unhashed Passwords in Database")
    print("=" * 50)
    
    # Fix passwords
    fix_passwords()
    print()
    
    # Test login after fix
    print("🔐 Testing Login After Password Fix")
    print("-" * 40)
    test_login_after_fix()
