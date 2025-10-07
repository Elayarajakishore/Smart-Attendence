import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { FACE_DETECTION_CONFIG, DISTANCE_PRESETS, DETECTION_TIPS } from '../config/faceDetection';

function AttendanceCamera() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [recognized, setRecognized] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [distance, setDistance] = useState('medium'); // close, medium, far

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      setLoading(true);
      // Load from local public/models for faster startup
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector_model'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68_model'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition_model')
        ]);
        setLoading(false);
      } catch (e) {
        setError('Failed to load face-api.js models.');
        setLoading(false);
      }
    };
    loadModels();
  }, []);

  // Real-time detection and attendance marking
  useEffect(() => {
    if (loading) return;
    let interval;
    let isProcessing = false;
    let isPosting = false;
    
    // Get settings based on selected distance
    const settings = DISTANCE_PRESETS[distance];
    
    // Optimized detector options for better distant face detection
    const detectorOptions = new faceapi.TinyFaceDetectorOptions({ 
      inputSize: settings.inputSize,
      scoreThreshold: settings.scoreThreshold
    });

    const process = async () => {
      if (
        isProcessing ||
        !webcamRef.current ||
        !webcamRef.current.video ||
        webcamRef.current.video.readyState !== 4
      ) {
        return;
      }
      isProcessing = true;
      try {
        const video = webcamRef.current.video;

        // Video actual size
        const displaySize = {
          width: video.videoWidth,
          height: video.videoHeight,
        };

        // Canvas match with video
        canvasRef.current.width = displaySize.width;
        canvasRef.current.height = displaySize.height;

        // Try multiple detection approaches for better coverage
        let detections = [];
        
        // Primary detection with current settings
        detections = await faceapi
          .detectAllFaces(video, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptors();

        // If no faces detected and using medium/far, try fallback settings
        if (detections.length === 0 && distance !== 'close') {
          const fallbackOptions = new faceapi.TinyFaceDetectorOptions({ 
            inputSize: FACE_DETECTION_CONFIG.fallback.inputSize,
            scoreThreshold: FACE_DETECTION_CONFIG.fallback.scoreThreshold
          });
          
          detections = await faceapi
            .detectAllFaces(video, fallbackOptions)
            .withFaceLandmarks()
            .withFaceDescriptors();
        }

        // Resize detections
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);

        resizedDetections.forEach((d, i) => {
          const { x, y, width, height } = d.detection.box;

          // Draw detection box with different colors based on confidence
          const confidence = d.detection.score;
          ctx.strokeStyle = confidence > 0.5 ? '#22c55e' : confidence > 0.3 ? '#f59e0b' : '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          // Add confidence score display
          ctx.fillStyle = ctx.strokeStyle;
          ctx.font = '12px Arial';
          ctx.fillText(
            `Conf: ${(confidence * 100).toFixed(1)}%`,
            x,
            y - 25
          );

          if (recognized[i]) {
            ctx.fillStyle = '#22c55e';
            ctx.font = '16px Arial';
            ctx.fillText(
              recognized[i].name || 'Recognized',
              x,
              y - 10
            );
          }
        });

        // Throttle network: when faces detected, send a snapshot to backend
        if (detections.length > 0 && !isPosting) {
          isPosting = true;
          try {
            // Capture current frame as JPEG
            const dataUrl = webcamRef.current.getScreenshot({ width: displaySize.width, height: displaySize.height });
            if (dataUrl) {
              const blob = await (await fetch(dataUrl)).blob();
              const form = new FormData();
              form.append('image', blob, 'frame.jpg');
              // Optional: send custom time if needed
              // form.append('custom_time', new Date().toISOString());
              const res = await axios.post('http://localhost:8000/process_media_attendance', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              setRecognized(res.data.recognized || []);
            } else {
              setRecognized([]);
            }
          } catch (err) {
            setRecognized([]);
          } finally {
            isPosting = false;
          }
        } else if (detections.length === 0) {
          setRecognized([]);
        }
      } finally {
        isProcessing = false;
      }
    };

    interval = setInterval(process, FACE_DETECTION_CONFIG.processing.interval);
    return () => clearInterval(interval);
  }, [loading, distance]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold text-red-700">Mark Attendance (Camera)</h2>
      {error && <div className="text-red-600">{error}</div>}

      {/* Distance Selector */}
      <div className="flex items-center gap-4 mb-2">
        <label className="font-semibold text-gray-700">Detection Range:</label>
        <select 
          value={distance} 
          onChange={(e) => setDistance(e.target.value)}
          className="border rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="close">Close (1-2m)</option>
          <option value="medium">Medium (2-4m)</option>
          <option value="far">Far (4-6m)</option>
        </select>
        <div className="text-xs text-gray-500">
          {DISTANCE_PRESETS[distance].description}
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border-2 border-blue-300 shadow">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="bg-black"
          videoConstraints={FACE_DETECTION_CONFIG.camera}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 z-10"
          style={{ pointerEvents: 'none' }}
        />
      </div>

      <div className="text-gray-700 text-sm mb-2">
        {loading ? 'Loading face recognition models...' :
          recognized.length > 0
            ? `Recognized: ${recognized.map(r => r.name).join(', ')}`
            : 'No recognized students in frame.'}
      </div>
      
      <div className="text-xs text-gray-500 text-center max-w-md">
        <p className="font-semibold mb-2">💡 Tips for better detection:</p>
        {DETECTION_TIPS.map((tip, index) => (
          <p key={index} className="mb-1">• {tip}</p>
        ))}
      </div>
    </div>
  );
}

export default AttendanceCamera; 