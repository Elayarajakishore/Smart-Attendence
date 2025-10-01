#!/usr/bin/env python3
"""
Test script to check all GET endpoints
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test health check endpoint"""
    print("🔍 Testing health check endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_test_endpoint():
    """Test simple test endpoint"""
    print("\n🔍 Testing test endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/test")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_students_endpoint():
    """Test students endpoint"""
    print("\n🔍 Testing students endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/students")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            students = response.json()
            print(f"Found {len(students)} students")
            for student in students:
                print(f"  - {student['name']} ({student['roll']})")
        else:
            print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_students_full_endpoint():
    """Test students_full endpoint"""
    print("\n🔍 Testing students_full endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/students_full")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            students = response.json()
            print(f"Found {len(students)} students")
            for student in students:
                print(f"  - {student['name']} ({student['roll']})")
        else:
            print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_attendance_endpoint():
    """Test attendance endpoint"""
    print("\n🔍 Testing attendance endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/attendance")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            records = response.json()
            print(f"Found {len(records)} attendance records")
            for record in records:
                print(f"  - {record['name']} ({record['roll']}) at {record['timestamp']}")
        else:
            print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_attendance_by_hour_endpoint():
    """Test attendance_by_hour endpoint"""
    print("\n🔍 Testing attendance_by_hour endpoint...")
    try:
        # Test with current hour
        current_hour = datetime.now().strftime("%H:00")
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        url = f"{BASE_URL}/attendance_by_hour?hour={current_hour}&date={current_date}"
        print(f"URL: {url}")
        
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Present: {len(data['present'])} students")
            print(f"Absent: {len(data['absent'])} students")
            
            print("Present students:")
            for student in data['present']:
                print(f"  - {student['name']} ({student['roll']})")
            
            print("Absent students:")
            for student in data['absent']:
                print(f"  - {student['name']} ({student['roll']})")
        else:
            print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing GET Endpoints...")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("Test Endpoint", test_test_endpoint),
        ("Students", test_students_endpoint),
        ("Students Full", test_students_full_endpoint),
        ("Attendance", test_attendance_endpoint),
        ("Attendance by Hour", test_attendance_by_hour_endpoint),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        success = test_func()
        results.append((test_name, success))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(f"\nOverall: {passed}/{total} tests passed")

if __name__ == "__main__":
    main()
