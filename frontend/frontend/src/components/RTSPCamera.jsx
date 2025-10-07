import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RTSPCamera() {
  const [rtspStatus, setRtspStatus] = useState({ running: false });
  const [lastCheck, setLastCheck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);

  // Check RTSP status
  const checkRtspStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rtsp/status');
      setRtspStatus(response.data);
      setLastCheck(new Date());
      setError('');
    } catch (err) {
      setError('Failed to check RTSP status');
      console.error('RTSP status check error:', err);
    }
  };

  // Start RTSP worker
  const startRtspWorker = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/rtsp/start');
      setMessage(response.data.message);
      await checkRtspStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start RTSP worker');
    }
    setLoading(false);
  };

  // Stop RTSP worker
  const stopRtspWorker = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/rtsp/stop');
      setMessage(response.data.message);
      await checkRtspStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to stop RTSP worker');
    }
    setLoading(false);
  };

  // Manual attendance marking
  const markAttendanceNow = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await axios.post('http://localhost:8000/rtsp/mark_attendance_now');
      setAttendanceData(response.data);
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    }
    setLoading(false);
  };

  // Check current frame
  const checkCurrentFrame = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8000/rtsp/check_now');
      setAttendanceData(response.data);
      setMessage(`Detected ${response.data.faces_detected} faces, recognized ${response.data.recognized.length} students`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check current frame');
    }
    setLoading(false);
  };

  useEffect(() => {
    checkRtspStatus();
    const interval = setInterval(checkRtspStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-red-700 mb-6">RTSP Camera Attendance</h2>
        
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Camera Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${rtspStatus.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                RTSP Worker: {rtspStatus.running ? 'Running' : 'Stopped'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              Last Check: {formatTime(lastCheck)}
            </div>
            
            {rtspStatus.last_frame_ts && (
              <div className="text-sm text-gray-600">
                Last Frame: {formatTime(new Date(rtspStatus.last_frame_ts))}
              </div>
            )}
            
            {rtspStatus.last_error && (
              <div className="text-sm text-red-600">
                Last Error: {rtspStatus.last_error}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={startRtspWorker}
              disabled={loading || rtspStatus.running}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Starting...' : 'Start Auto Attendance'}
            </button>
            
            <button
              onClick={stopRtspWorker}
              disabled={loading || !rtspStatus.running}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Stopping...' : 'Stop Auto Attendance'}
            </button>
            
            <button
              onClick={checkRtspStatus}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>

        {/* Manual Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Manual Attendance</h3>
          
          <div className="flex space-x-4 mb-4">
            <button
              onClick={checkCurrentFrame}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Checking...' : 'Check Current Frame'}
            </button>
            
            <button
              onClick={markAttendanceNow}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Mark Attendance Now'}
            </button>
          </div>

          {message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-blue-800 font-medium">Status:</div>
              <div className="text-blue-700">{message}</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-800 font-medium">Error:</div>
              <div className="text-red-700">{error}</div>
            </div>
          )}
        </div>

        {/* Results */}
        {attendanceData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Detection Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {attendanceData.faces_detected || 0}
                </div>
                <div className="text-sm text-gray-600">Faces Detected</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {attendanceData.recognized?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Students Recognized</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {attendanceData.attendance_marked?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Attendance Marked</div>
              </div>
            </div>

            {attendanceData.recognized && attendanceData.recognized.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Recognized Students:</h4>
                <div className="space-y-2">
                  {attendanceData.recognized.map((student, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{student.name}</span>
                        <span className="text-gray-500 ml-2">({student.roll})</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Confidence: {student.confidence?.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attendanceData.attendance_marked && attendanceData.attendance_marked.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">New Attendance Marked:</h4>
                <div className="space-y-2">
                  {attendanceData.attendance_marked.map((student, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <span className="font-medium text-green-800">{student.name}</span>
                        <span className="text-green-600 ml-2">({student.roll})</span>
                      </div>
                      <div className="text-sm text-green-600">
                        Confidence: {student.confidence?.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Recognition History */}
        {rtspStatus.last_recognized && rtspStatus.last_recognized.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Recognition History</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {rtspStatus.last_recognized.slice(-10).map((recognition, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{recognition.name}</span>
                    <span className="text-gray-500 ml-2">({recognition.roll})</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {recognition.confidence?.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RTSPCamera;
