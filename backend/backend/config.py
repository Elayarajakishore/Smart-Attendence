import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# RTSP Camera Configuration
RTSP_URL = os.getenv("RTSP_URL", "rtsp://nithish:nithish123@10.204.227.108:554/stream1")

# RTSP Worker Settings
RTSP_SCAN_INTERVAL_MS = int(os.getenv("RTSP_SCAN_INTERVAL_MS", "2000"))
RTSP_FRAME_SKIP = int(os.getenv("RTSP_FRAME_SKIP", "0"))

# Attendance Settings
ATTENDANCE_START_AFTER = os.getenv("ATTENDANCE_START_AFTER")

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "face_reco")
