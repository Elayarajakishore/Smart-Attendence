#!/usr/bin/env python3
"""
Startup script for the Face Recognition Attendance System
This script will start both the backend API and frontend development server
"""

import subprocess
import sys
import os
import time
import signal
import threading
from pathlib import Path

def run_backend():
    """Start the FastAPI backend server"""
    backend_dir = Path("backend/backend")
    os.chdir(backend_dir)
    
    print("🚀 Starting Backend API Server...")
    print("📍 Backend URL: http://localhost:8000")
    print("📖 API Docs: http://localhost:8000/docs")
    print("-" * 50)
    
    try:
        subprocess.run([sys.executable, "app.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Backend server stopped")
    except Exception as e:
        print(f"❌ Backend error: {e}")

def run_frontend():
    """Start the React frontend development server"""
    frontend_dir = Path("frontend/frontend")
    os.chdir(frontend_dir)
    
    print("🎨 Starting Frontend Development Server...")
    print("📍 Frontend URL: http://localhost:3000")
    print("-" * 50)
    
    try:
        subprocess.run(["npm", "run", "dev"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped")
    except Exception as e:
        print(f"❌ Frontend error: {e}")

def main():
    """Main function to start both servers"""
    print("=" * 60)
    print("🎯 FACE RECOGNITION ATTENDANCE SYSTEM")
    print("=" * 60)
    print()
    print("📋 System Components:")
    print("   • Backend API (FastAPI + MongoDB)")
    print("   • Frontend (React + face-api.js)")
    print("   • RTSP Camera Integration")
    print("   • Face Recognition & Attendance Marking")
    print()
    print("🔧 Prerequisites:")
    print("   • MongoDB running on localhost:27017")
    print("   • Node.js and npm installed")
    print("   • Python dependencies installed")
    print()
    print("📝 RTSP Camera URL: rtsp://nithish:nithish123@10.204.227.108:554/stream1")
    print()
    print("=" * 60)
    print()
    
    # Check if we're in the right directory
    if not Path("backend").exists() or not Path("frontend").exists():
        print("❌ Error: Please run this script from the project root directory")
        print("   Expected structure:")
        print("   project_root/")
        print("   ├── backend/")
        print("   ├── frontend/")
        print("   └── start_system.py")
        sys.exit(1)
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=run_backend, daemon=True)
    backend_thread.start()
    
    # Wait a moment for backend to start
    time.sleep(3)
    
    # Start frontend in the main thread
    try:
        run_frontend()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down system...")
        print("✅ System stopped successfully")

if __name__ == "__main__":
    main()
