import React, { useState, useRef } from 'react';
import axios from 'axios';

function MediaAttendance() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('image');
  const [customTime, setCustomTime] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
  });
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setResults(null);
      
      // Determine file type
      if (file.type.startsWith('image/')) {
        setFileType('image');
      } else if (file.type.startsWith('video/')) {
        setFileType('video');
      } else {
        setError('Please select an image or video file.');
        setSelectedFile(null);
      }
    }
  };

  const extractFramesFromVideo = async (videoFile) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frames = [];

      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;

      const startSeeking = () => {
        // Kick off extraction
        video.currentTime = 0;
      };

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        startSeeking();
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0);
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        frames.push(frameData);

        if (video.currentTime + 1 < video.duration) {
          video.currentTime = Math.min(video.currentTime + 1, video.duration);
        } else {
          resolve(frames);
        }
      };

      video.src = URL.createObjectURL(videoFile);
    });
  };

  const processImage = async (imageData) => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');
      
      const res = await axios.post('http://localhost:8000/process_media_attendance', formData, {
        params: { custom_time: customTime }
      });
      
      return res.data;
    } catch (err) {
      console.error('Error processing image:', err);
      return { recognized: [], error: 'Failed to process image' };
    }
  };

  const handleProcessMedia = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setProcessing(true);
    setError('');
    setResults(null);

    try {
      let allRecognized = [];
      let allErrors = [];

      if (fileType === 'image') {
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          const result = await processImage(e.target.result);
          if (result.error) {
            allErrors.push(result.error);
          } else {
            allRecognized = allRecognized.concat(result.recognized || []);
          }
          setResults({ recognized: allRecognized, errors: allErrors });
          setProcessing(false);
        };
        reader.readAsDataURL(selectedFile);
      } else {
      
        const frames = await extractFramesFromVideo(selectedFile);
        
        for (let i = 0; i < frames.length; i++) {
          const result = await processImage(frames[i]);
          if (result.error) {
            allErrors.push(`Frame ${i + 1}: ${result.error}`);
          } else {
            allRecognized = allRecognized.concat(result.recognized || []);
          }
        }
        
       
        const uniqueRecognized = allRecognized.filter((student, index, self) => 
          index === self.findIndex(s => s.roll === student.roll)
        );
        
        setResults({ recognized: uniqueRecognized, errors: allErrors });
        setProcessing(false);
      }
    } catch (err) {
      setError('Failed to process media file.');
      setProcessing(false);
    }
  };

  const renderStudentCard = (student) => (
    <div key={student.roll} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-green-600 font-semibold">{student.name.charAt(0)}</span>
      </div>
      <div className="flex-1">
        <div className="font-semibold text-green-700">{student.name}</div>
        <div className="text-sm text-gray-500">Roll: {student.roll}</div>
        {student.confidence && (
          <div className="text-xs text-green-600 font-medium">
            Confidence: {student.confidence.toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-green-600">
        ✅
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-red-700">Media Attendance Processing</h2>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Upload Media File</h3>
        
        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image or Video File
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {selectedFile.name} ({fileType})
            </p>
          )}
        </div>

        {/* Custom Time Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Date & Time for Attendance
          </label>
          <input
            type="datetime-local"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            This time will be used for marking attendance instead of current time
          </p>
        </div>

        {/* Process Button */}
        <button
          onClick={handleProcessMedia}
          disabled={!selectedFile || processing}
          className={`w-full py-3 px-4 rounded-md font-semibold text-white transition-colors ${
            !selectedFile || processing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {processing ? 'Processing...' : 'Process Media & Mark Attendance'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Processing Results</h3>
          
          {results.recognized.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-semibold text-green-700 mb-2">
                ✅ Students Recognized ({results.recognized.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.recognized.map(renderStudentCard)}
              </div>
            </div>
          )}

          {results.total_faces_detected > results.recognized.length && (
            <div className="mb-4">
              <h4 className="text-md font-semibold text-orange-700 mb-2">
                ❌ Unregistered Faces Detected ({results.total_faces_detected - results.recognized.length})
              </h4>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-700 text-sm">
                  {results.total_faces_detected - results.recognized.length} face(s) were detected but not recognized as registered students.
                  These faces will be treated as absent.
                </p>
              </div>
            </div>
          )}

          {results.errors.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-red-700 mb-2">
                Errors ({results.errors.length})
              </h4>
              <div className="space-y-1">
                {results.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {results.recognized.length === 0 && results.errors.length === 0 && (
            <p className="text-gray-500">No students were recognized in the media file.</p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Upload an image or video file containing student faces</li>
          <li>• Select a custom date and time for attendance marking</li>
          <li>• <strong>Only registered students will be recognized</strong> - unregistered faces will be rejected</li>
          <li>• The system uses EXTREMELY strict matching (75%+ confidence required)</li>
          <li>• <strong>Only faces actually detected in the frame will be marked present</strong></li>
          <li>• For videos, frames are extracted every second for processing</li>
          <li>• Duplicate recognitions are automatically filtered</li>
          <li>• Unregistered faces will be treated as absent</li>
        </ul>
      </div>
    </div>
  );
}

export default MediaAttendance;
