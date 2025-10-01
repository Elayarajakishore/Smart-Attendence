#!/usr/bin/env python3
"""
Test script to verify MongoDB connection and attendance storage
"""

from pymongo import MongoClient
from datetime import datetime, timedelta
import sys

def test_mongodb_connection():
    """Test MongoDB connection"""
    try:
        client = MongoClient("mongodb://localhost:27017/")
        # Test the connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        return client
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return None

def test_database_and_collections(client):
    """Test database and collections"""
    try:
        db = client["face_reco"]
        students_col = db["students"]
        attendance_col = db["attendance"]
        
        print(f"✅ Database 'face_reco' accessed successfully")
        print(f"✅ Collections: students ({students_col.count_documents({})} documents), attendance ({attendance_col.count_documents({})} documents)")
        return db, students_col, attendance_col
    except Exception as e:
        print(f"❌ Database/collection access failed: {e}")
        return None, None, None

def test_attendance_insertion(attendance_col):
    """Test attendance insertion"""
    try:
        # Test data
        test_attendance = {
            "roll": "TEST001",
            "name": "Test Student",
            "timestamp": datetime.now()
        }
        
        # Insert test attendance
        result = attendance_col.insert_one(test_attendance)
        print(f"✅ Test attendance inserted with ID: {result.inserted_id}")
        
        # Verify insertion
        inserted = attendance_col.find_one({"_id": result.inserted_id})
        if inserted:
            print(f"✅ Attendance verification successful: {inserted['name']} ({inserted['roll']})")
        else:
            print("❌ Attendance verification failed")
        
        # Clean up test data
        attendance_col.delete_one({"_id": result.inserted_id})
        print("✅ Test data cleaned up")
        
        return True
    except Exception as e:
        print(f"❌ Attendance insertion test failed: {e}")
        return False

def test_attendance_query(attendance_col):
    """Test attendance querying by hour"""
    try:
        now = datetime.now()
        hour_start = now.replace(minute=0, second=0, microsecond=0)
        hour_end = hour_start + timedelta(hours=1)
        
        # Query attendance for current hour
        records = list(attendance_col.find({
            "timestamp": {"$gte": hour_start, "$lt": hour_end}
        }))
        
        print(f"✅ Attendance query successful: {len(records)} records found for current hour")
        for record in records:
            print(f"   - {record['name']} ({record['roll']}) at {record['timestamp']}")
        
        return True
    except Exception as e:
        print(f"❌ Attendance query test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🔍 Testing MongoDB and Attendance Storage...")
    print("=" * 50)
    
    # Test 1: MongoDB Connection
    client = test_mongodb_connection()
    if not client:
        print("❌ Cannot proceed without MongoDB connection")
        sys.exit(1)
    
    # Test 2: Database and Collections
    db, students_col, attendance_col = test_database_and_collections(client)
    if not db:
        print("❌ Cannot proceed without database access")
        sys.exit(1)
    
    # Test 3: Attendance Insertion
    if not test_attendance_insertion(attendance_col):
        print("❌ Attendance insertion test failed")
        sys.exit(1)
    
    # Test 4: Attendance Query
    if not test_attendance_query(attendance_col):
        print("❌ Attendance query test failed")
        sys.exit(1)
    
    print("=" * 50)
    print("✅ All tests passed! MongoDB and attendance storage are working correctly.")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    main()
