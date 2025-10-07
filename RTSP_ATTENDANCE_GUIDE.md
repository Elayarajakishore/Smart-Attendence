# RTSP Camera Attendance System Guide

## Overview
This system integrates with your RTSP camera (`rtsp://nithish:nithish123@10.204.227.108:554/stream1`) to automatically mark attendance using face recognition.

## Features Added

### Backend Enhancements
1. **RTSP URL Configuration**: Your camera URL is now configured as default
2. **Manual Attendance Marking**: New endpoint `/rtsp/mark_attendance_now` for instant attendance marking
3. **RTSP Worker Management**: Start/stop automatic attendance monitoring
4. **Real-time Status**: Check camera connection and recognition status

### Frontend Enhancements
1. **RTSP Camera Component**: New dedicated interface for RTSP camera management
2. **Real-time Monitoring**: Live status updates and recognition history
3. **Manual Controls**: Buttons for immediate attendance marking
4. **Visual Feedback**: Clear status indicators and error messages

## How to Use

### 1. Start the System
```bash
# Option 1: Use the startup script
python start_system.py

# Option 2: Start manually
# Terminal 1 - Backend
cd backend/backend
python app.py

# Terminal 2 - Frontend  
cd frontend/frontend
npm run dev
```

### 2. Access the System
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 3. Mark Attendance with RTSP Camera

#### Option A: Automatic Attendance (Recommended)
1. Go to **"RTSP Camera"** tab in the frontend
2. Click **"Start Auto Attendance"** 
3. The system will continuously monitor the camera and mark attendance automatically
4. Students just need to look at the camera

#### Option B: Manual Attendance
1. Go to **"RTSP Camera"** tab
2. Click **"Check Current Frame"** to see who's detected
3. Click **"Mark Attendance Now"** to mark attendance for detected students

### 4. Monitor Attendance
- **Dashboard**: View real-time attendance statistics
- **Attendance List**: See all attendance records
- **RTSP Camera**: View recognition history and status

## API Endpoints

### RTSP Management
- `GET /rtsp/status` - Check RTSP worker status
- `POST /rtsp/start` - Start automatic attendance monitoring
- `POST /rtsp/stop` - Stop automatic attendance monitoring
- `POST /rtsp/mark_attendance_now` - Manually mark attendance from current frame
- `GET /rtsp/check_now` - Check current frame without marking attendance

### Attendance Management
- `GET /attendance` - Get all attendance records
- `GET /attendance_by_hour` - Get attendance for specific hour
- `POST /mark_attendance` - Mark attendance from uploaded photo
- `POST /mark_attendance_batch` - Mark attendance for multiple faces

## Configuration

### RTSP Settings (config.py)
```python
RTSP_URL = "rtsp://nithish:nithish123@10.204.227.108:554/stream1"
RTSP_SCAN_INTERVAL_MS = 2000  # Check every 2 seconds
RTSP_FRAME_SKIP = 0           # Process every frame
```

### Environment Variables
Create a `.env` file in `backend/backend/`:
```env
RTSP_URL=rtsp://nithish:nithish123@10.204.227.108:554/stream1
RTSP_SCAN_INTERVAL_MS=2000
RTSP_FRAME_SKIP=0
MONGODB_URL=mongodb://localhost:27017/
DATABASE_NAME=face_reco
```

## Troubleshooting

### Camera Connection Issues
1. **Check RTSP URL**: Verify the camera URL is correct
2. **Network Access**: Ensure the camera is accessible from your system
3. **Credentials**: Verify username/password are correct
4. **Port**: Check if port 554 is open and accessible

### Face Recognition Issues
1. **Lighting**: Ensure good lighting for face detection
2. **Distance**: Students should be 1-4 meters from camera
3. **Registration**: Students must be registered in the system first
4. **Face Quality**: Clear, front-facing photos work best

### Performance Issues
1. **Frame Skip**: Increase `RTSP_FRAME_SKIP` to process fewer frames
2. **Scan Interval**: Increase `RTSP_SCAN_INTERVAL_MS` to check less frequently
3. **Database**: Ensure MongoDB is running and responsive

## System Requirements

### Backend
- Python 3.8+
- FastAPI
- OpenCV
- face_recognition
- MongoDB
- pymongo

### Frontend
- Node.js 16+
- React 18+
- face-api.js
- Axios

### Camera
- RTSP-compatible IP camera
- Network access to camera
- Good lighting conditions

## Security Notes

1. **RTSP Credentials**: Store camera credentials securely
2. **Network Security**: Use VPN or secure network for camera access
3. **Data Privacy**: Face encodings are stored locally in MongoDB
4. **Access Control**: Staff login required for system access

## Support

If you encounter issues:
1. Check the browser console for frontend errors
2. Check the backend logs for API errors
3. Verify camera connectivity
4. Ensure all dependencies are installed
5. Check MongoDB connection

## Next Steps

1. **Test the System**: Register a few students and test attendance marking
2. **Configure Settings**: Adjust scan intervals based on your needs
3. **Monitor Performance**: Check recognition accuracy and system performance
4. **Scale Up**: Add more cameras or optimize for larger groups
