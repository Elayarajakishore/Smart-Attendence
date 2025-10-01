// Face Detection Configuration
// Adjust these settings based on your camera setup and requirements

export const FACE_DETECTION_CONFIG = {
  // Primary detection settings (for normal distance)
  primary: {
    inputSize: 320,        // Larger = better for distant faces, but slower
    scoreThreshold: 0.3,   // Lower = detects more faces, but may include false positives
  },
  
  // Fallback settings (for very distant faces)
  fallback: {
    inputSize: 416,        // Even larger for distant detection
    scoreThreshold: 0.2,   // Very low threshold
  },
  
  // Processing settings
  processing: {
    interval: 300,         // Milliseconds between detections (lower = more responsive)
    maxFaces: 5,           // Maximum faces to process per frame
  },
  
  // Recognition settings
  recognition: {
    tolerance: 0.6,        // Backend tolerance (0.4 = strict, 0.7 = lenient)
    minConfidence: 0.3,    // Minimum confidence to display detection box
  },
  
  // Camera settings
  camera: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'user',
  }
};

// Distance-based presets
export const DISTANCE_PRESETS = {
  close: {
    inputSize: 192,
    scoreThreshold: 0.5,
    tolerance: 0.4,
    description: "Close range (1-2 meters)"
  },
  medium: {
    inputSize: 320,
    scoreThreshold: 0.3,
    tolerance: 0.6,
    description: "Medium range (2-4 meters)"
  },
  far: {
    inputSize: 416,
    scoreThreshold: 0.2,
    tolerance: 0.7,
    description: "Far range (4-6 meters)"
  }
};

// Get optimal settings based on distance
export function getOptimalSettings(distance = 'medium') {
  return DISTANCE_PRESETS[distance] || DISTANCE_PRESETS.medium;
}

// Tips for better detection
export const DETECTION_TIPS = [
  "Ensure good lighting - avoid backlighting",
  "Face the camera directly",
  "Stay within 2-4 meters of the camera",
  "Avoid rapid movements",
  "Remove sunglasses or hats if possible",
  "Ensure camera lens is clean",
  "Use a stable camera mount"
];

