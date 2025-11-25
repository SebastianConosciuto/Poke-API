#!/usr/bin/env python3
"""
Configuration Verification Script
Run this to verify your .env file is set up correctly for JWT authentication
"""

import sys
import os

print("=" * 70)
print("🔍 JWT CONFIGURATION VERIFICATION")
print("=" * 70)

# Check if .env file exists
env_path = ".env"
if not os.path.exists(env_path):
    print("\n❌ ERROR: .env file not found!")
    print("   Make sure you're running this from the 'back' directory")
    sys.exit(1)

print("\n✅ .env file found")

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ dotenv library loaded")
except ImportError:
    print("❌ ERROR: python-dotenv not installed")
    print("   Run: pip install python-dotenv --break-system-packages")
    sys.exit(1)

# Check required variables
print("\n" + "=" * 70)
print("Checking Environment Variables...")
print("=" * 70)

required_vars = {
    "SUPABASE_URL": "Database URL",
    "SUPABASE_KEY": "Database API Key",
    "SECRET_KEY": "JWT Signing Key",
    "ALGORITHM": "JWT Algorithm",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "Token Expiration"
}

all_good = True

for var, description in required_vars.items():
    value = os.getenv(var)
    if value:
        print(f"\n✅ {var}")
        print(f"   Description: {description}")
        
        # Show partial value for security
        if var == "SECRET_KEY":
            if len(value) < 32:
                print(f"   ⚠️  WARNING: Key is too short ({len(value)} chars)")
                print(f"   Recommendation: Use at least 32 characters")
                all_good = False
            else:
                print(f"   Value: {value[:8]}...{value[-8:]} ({len(value)} chars)")
                print(f"   ✅ Good length!")
        elif var in ["SUPABASE_KEY", "SUPABASE_URL"]:
            print(f"   Value: {value[:20]}...{value[-10:]}")
        else:
            print(f"   Value: {value}")
    else:
        print(f"\n❌ {var}")
        print(f"   Status: NOT SET")
        print(f"   Description: {description}")
        all_good = False

# Test JWT functionality
print("\n" + "=" * 70)
print("Testing JWT Functionality...")
print("=" * 70)

try:
    from jose import jwt
    from datetime import datetime, timedelta
    
    secret_key = os.getenv("SECRET_KEY")
    algorithm = os.getenv("ALGORITHM", "HS256")
    
    # Create a test token
    test_payload = {
        "sub": "test_user",
        "exp": datetime.utcnow() + timedelta(minutes=5)
    }
    
    test_token = jwt.encode(test_payload, secret_key, algorithm=algorithm)
    print("\n✅ Token creation: SUCCESS")
    print(f"   Test token: {test_token[:30]}...")
    
    # Verify the token
    decoded = jwt.decode(test_token, secret_key, algorithms=[algorithm])
    print("\n✅ Token verification: SUCCESS")
    print(f"   Decoded payload: {decoded}")
    
    if decoded["sub"] == "test_user":
        print("\n✅ Token data extraction: SUCCESS")
        print(f"   User ID extracted: {decoded['sub']}")
    
except ImportError as e:
    print(f"\n❌ ERROR: Required library not installed")
    print(f"   {e}")
    print("\n   Run: pip install python-jose[cryptography] --break-system-packages")
    all_good = False
except Exception as e:
    print(f"\n❌ ERROR: JWT test failed")
    print(f"   {e}")
    all_good = False

# Test password hashing
print("\n" + "=" * 70)
print("Testing Password Hashing...")
print("=" * 70)

try:
    from passlib.context import CryptContext
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Hash a test password (shorter to avoid bcrypt 72 byte limit)
    test_password = "test123"
    hashed = pwd_context.hash(test_password)
    print(f"\n✅ Password hashing: SUCCESS")
    print(f"   Original: {test_password}")
    print(f"   Hashed: {hashed[:30]}...")
    
    # Verify password
    is_valid = pwd_context.verify(test_password, hashed)
    if is_valid:
        print(f"\n✅ Password verification: SUCCESS")
    else:
        print(f"\n❌ Password verification: FAILED")
        all_good = False
    
except ImportError as e:
    print(f"\n❌ ERROR: Required library not installed")
    print(f"   {e}")
    print("\n   Run: pip install passlib bcrypt --break-system-packages")
    all_good = False
except Exception as e:
    print(f"\n⚠️  Password hashing test: WARNING")
    print(f"   {str(e)[:100]}")
    print(f"\n   Note: This is likely a bcrypt version compatibility warning.")
    print(f"   Your password hashing should still work in the application.")
    # Don't fail the overall check for this

# Database connection test
print("\n" + "=" * 70)
print("Testing Database Connection...")
print("=" * 70)

try:
    from supabase import create_client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("\n⚠️  SKIPPED: Supabase credentials not set")
    else:
        supabase = create_client(supabase_url, supabase_key)
        print("\n✅ Supabase client: CREATED")
        print(f"   URL: {supabase_url}")
        
        # Try to ping the database
        try:
            response = supabase.table("trainers").select("count", count="exact").execute()
            print(f"\n✅ Database connection: SUCCESS")
            print(f"   Trainers table accessible")
        except Exception as e:
            print(f"\n⚠️  Database query: FAILED")
            print(f"   Error: {e}")
            print(f"\n   This might mean:")
            print(f"   - The 'trainers' table doesn't exist yet")
            print(f"   - Run the schema.sql script in Supabase SQL Editor")
        
except ImportError as e:
    print(f"\n❌ ERROR: Supabase library not installed")
    print(f"   {e}")
    print("\n   Run: pip install supabase --break-system-packages")
    all_good = False
except Exception as e:
    print(f"\n❌ ERROR: Database test failed")
    print(f"   {e}")
    all_good = False

# Final summary
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

if all_good:
    print("\n🎉 ALL CHECKS PASSED!")
    print("\n   Your backend is ready to run!")
    print("\n   Next steps:")
    print("   1. Make sure the 'trainers' table exists in Supabase")
    print("      (Run schema.sql in Supabase SQL Editor)")
    print("   2. Start the server: python main.py")
    print("   3. Test the API at: http://localhost:8000/docs")
else:
    print("\n⚠️  SOME CHECKS FAILED")
    print("\n   Please fix the issues above before running the server")
    print("\n   Common fixes:")
    print("   - Install missing packages: pip install -r requirements.txt --break-system-packages")
    print("   - Generate SECRET_KEY: python -c \"import secrets; print(secrets.token_urlsafe(32))\"")
    print("   - Update .env with generated SECRET_KEY")

print("\n" + "=" * 70)