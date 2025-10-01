from fastapi import FastAPI, UploadFile, File, Form, Request, Query, Body
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import face_recognition
import numpy as np
import cv2
import os
from datetime import datetime, timedelta
from typing import List
from bson import ObjectId
from twilio.rest import Client
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()  # Load .env file

router = APIRouter()
TWILIO_SID = os.getenv("TWILIO_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP = os.getenv("TWILIO_WHATSAPP")
twilio_client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)

def send_whatsapp_message(to_number: str, message: str):
    try:
        twilio_client.messages.create(
            from_=TWILIO_WHATSAPP,
            body=message,
            to=f"whatsapp:{to_number}"
        )
        print(f"✅ WhatsApp sent to {to_number}")
    except Exception as e:
        print("❌ WhatsApp error:", str(e))


app = FastAPI()

# ✅ Allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # your React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["face_reco"]
students_col = db["students"]
attendance_col = db["attendance"]


# Helper: Save face encoding
def get_face_encoding(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(rgb_img)
    if encodings:
        return encodings[0].tolist()
    return None

@app.get("/")
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        client.admin.command('ping')
        return {
            "status": "healthy",
            "message": "Face Recognition Attendance System API is running",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "message": "Database connection failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

@app.get("/test")
def test_endpoint():
    """Simple test endpoint"""
    return {"message": "API is working!", "timestamp": datetime.now().isoformat()}

@app.post("/students")
def add_student(
    name: str = Form(...),
    roll: str = Form(...),
    specialization: str = Form(...),
    department: str = Form(...),
    section: str = Form(...),
    batch: str = Form(...),
    phone: str = Form(...),   # ✅ New field for phone with country code
    photo: UploadFile = File(...)
):
    # Check for duplicate roll or name
    if students_col.find_one({"roll": roll}) or students_col.find_one({"name": name}):
        return JSONResponse(
            status_code=400,
            content={"error": "Student with this roll number or name already exists."}
        )

    # Validate phone number format (+countrycodexxxxxxxx)
    import re
    if not re.match(r"^\+\d{10,15}$", phone):
        return JSONResponse(status_code=400, content={"error": "Invalid phone number format. Use +919876543210 style."})

    image_bytes = photo.file.read()
    encoding = get_face_encoding(image_bytes)
    if encoding is None:
        return JSONResponse(status_code=400, content={"error": "No face detected in the photo."})

    # Store image as base64 string
    import base64
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    student = {
        "name": name,
        "roll": roll,
        "specialization": specialization,
        "department": department,
        "section": section,
        "batch": batch,
        "phone": phone,   # ✅ Save phone
        "face_encoding": encoding,
        "photo_b64": image_b64
    }

    students_col.insert_one(student)
    return {"message": "Student added successfully."}



@app.get("/students")
def list_students():
    students = list(students_col.find({}, {"face_encoding": 0}))
    for s in students:
        s["_id"] = str(s["_id"])
    return students

@app.post("/mark_attendance")
def mark_attendance(photo: UploadFile = File(...)):
    image_bytes = photo.file.read()
    encoding = get_face_encoding(image_bytes)
    if encoding is None:
        return JSONResponse(status_code=400, content={"error": "No face detected in the photo."})
    students = list(students_col.find())
    encoding_np = np.array(encoding)
    now = datetime.now()
    hour_start = now.replace(minute=0, second=0, microsecond=0)
    hour_end = hour_start + timedelta(hours=1)
    for student in students:
        known_encoding = np.array(student["face_encoding"])
        matches = face_recognition.compare_faces([known_encoding], encoding_np, tolerance=0.25)
        if matches[0]:
            # Check for existing attendance in this hour
            exists = attendance_col.find_one({
                "roll": student["roll"],
                "timestamp": {"$gte": hour_start, "$lt": hour_end}
            })
            if not exists:
                attendance_col.insert_one({
                    "roll": student["roll"],
                    "name": student["name"],
                    "timestamp": now
                })
                return {"message": f"Attendance marked for {student['name']} ({student['roll']})"}
            else:
                return {"message": f"Attendance already marked for {student['name']} ({student['roll']}) this hour."}
    return JSONResponse(status_code=404, content={"error": "Face not recognized."})

@app.post("/mark_attendance_batch")
async def mark_attendance_batch(request: Request):
    """
    Mark attendance for multiple faces (batch mode).
    """
    try:
        data = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON."})

    encodings = data.get("encodings", [])
    if not isinstance(encodings, list) or not encodings:
        return JSONResponse(status_code=400, content={"error": "No encodings provided."})

    students = list(students_col.find())
    recognized = []
    now = datetime.now()
    hour_start = now.replace(minute=0, second=0, microsecond=0)
    hour_end = hour_start + timedelta(hours=1)

    # EXTREMELY strict tolerance - only exact matches
    tolerance = 0.25  # Even stricter - only very high confidence matches
    confidence_threshold = 0.75  # Higher confidence required (75%+)

    for encoding in encodings:
        encoding_np = np.array(encoding)
        best_match = None
        best_distance = float('inf')
        best_confidence = 0
        
        # Find the best match among all students
        for student in students:
            known_encoding = np.array(student["face_encoding"])
            try:
                # Calculate face distance and confidence
                distance = face_recognition.face_distance([known_encoding], encoding_np)[0]
                confidence = (1 - distance) * 100  # Convert to percentage
                
                # Only consider if both distance and confidence meet strict criteria
                if distance < best_distance and distance <= tolerance and confidence >= confidence_threshold:
                    best_distance = distance
                    best_confidence = confidence
                    best_match = student
            except Exception as e:
                # Skip invalid encodings
                continue
        
        if best_match:
            print(f"✅ Face MATCHED: {best_match['name']} ({best_match['roll']}) - Distance: {best_distance:.3f}, Confidence: {best_confidence:.1f}%")
            # Always add to recognized list (even if already marked in DB)
            if best_match["roll"] not in [r["roll"] for r in recognized]:
                recognized.append({
                    "roll": best_match["roll"],
                    "name": best_match["name"],
                    "confidence": best_confidence
                })

            # Only insert if not already in DB
            exists = attendance_col.find_one({
                "roll": best_match["roll"],
                "timestamp": {"$gte": hour_start, "$lt": hour_end}
            })
            if not exists:
                attendance_col.insert_one({
                    "roll": best_match["roll"],
                    "name": best_match["name"],
                    "timestamp": now,
                    "confidence": best_confidence
                })
        else:
            print(f"❌ Face REJECTED: No registered student match (best distance: {best_distance:.3f}, tolerance: {tolerance}, confidence threshold: {confidence_threshold}%)")

    if recognized:
        return {"recognized": recognized}
    return JSONResponse(status_code=404, content={"error": "No recognized faces."})

@app.post("/process_media_attendance")
async def process_media_attendance(image: UploadFile, custom_time: str = Query(None)):
    try:
        print(f"Processing media attendance with custom_time: {custom_time}")
        # Read and process the uploaded image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            print("Invalid image file provided")
            return JSONResponse(status_code=400, content={"error": "Invalid image file"})
        
        # Convert BGR to RGB
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detect faces in the image
        # Try with a small upsample for better detection on smaller faces
        face_locations = face_recognition.face_locations(rgb_img, number_of_times_to_upsample=1)
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        
        print(f"Detected {len(face_encodings)} faces in the image")
        
        if not face_encodings:
            return JSONResponse(status_code=200, content={"recognized": [], "message": "No faces detected in the image"})
        
        # Get all students from database
        students = list(students_col.find())
        if not students:
            print("No students registered in database")
            return JSONResponse(status_code=200, content={"recognized": [], "message": "No students registered"})
        
        # Parse custom time if provided
        if custom_time:
            try:
                custom_datetime = datetime.fromisoformat(custom_time.replace('T', ' '))
                now = custom_datetime
                print(f"Using custom time: {now}")
            except ValueError:
                print(f"Invalid custom time format: {custom_time}")
                return JSONResponse(status_code=400, content={"error": "Invalid custom time format"})
        else:
            now = datetime.now()
            print(f"Using current time: {now}")
        
        # Calculate hour boundaries for attendance
        hour_start = now.replace(minute=0, second=0, microsecond=0)
        hour_end = hour_start + timedelta(hours=1)
        
        print(f"Checking attendance for hour: {hour_start} to {hour_end}")
        
        recognized = []
        
        # Compare each detected face with registered students
        for i, encoding in enumerate(face_encodings):
            encoding_np = np.array(encoding)

            # EXTREMELY strict tolerance - only exact matches
            tolerance = 0.25  # Even stricter - only very high confidence matches
            confidence_threshold = 0.75  # Higher confidence required (75%+)
            best_match = None
            best_distance = float('inf')
            best_confidence = 0
            
            print(f"Processing face {i}...")

            for student in students:
                known_encoding = np.array(student["face_encoding"])
                try:
                    distance = face_recognition.face_distance([known_encoding], encoding_np)[0]
                    confidence = (1 - distance) * 100  # Convert to percentage
                    print(f"  Distance to {student['name']} ({student['roll']}): {distance:.3f} (confidence: {confidence:.1f}%)")
                except Exception as e:
                    print(f"  Error calculating distance to {student['name']}: {e}")
                    continue
                
                # Only consider if both distance and confidence meet strict criteria
                if distance < best_distance and distance <= tolerance and confidence >= confidence_threshold:
                    best_distance = distance
                    best_confidence = confidence
                    best_match = student

            if best_match is not None:
                print(f"✅ Face {i} MATCHED: {best_match['name']} ({best_match['roll']}) - Distance: {best_distance:.3f}, Confidence: {best_confidence:.1f}%")
                
                # Double-check: Only mark attendance if confidence is very high
                if best_confidence >= 75.0:  # Extra strict check
                    exists = attendance_col.find_one({
                        "roll": best_match["roll"],
                        "timestamp": {"$gte": hour_start, "$lt": hour_end}
                    })

                    if not exists:
                        attendance_record = {
                            "roll": best_match["roll"],
                            "name": best_match["name"],
                            "timestamp": now,
                            "confidence": best_confidence,
                            "face_detected": True  # Mark that this was from actual face detection
                        }
                        result = attendance_col.insert_one(attendance_record)
                        print(f"✅ Attendance marked for {best_match['name']} with ID: {result.inserted_id}")
                    else:
                        print(f"⚠️ Attendance already exists for {best_match['name']} this hour")

                    # Add to recognized list (reporting)
                    recognized.append({
                        "roll": best_match["roll"],
                        "name": best_match["name"],
                        "confidence": best_confidence
                    })
                else:
                    print(f"❌ Face {i} REJECTED: Confidence too low ({best_confidence:.1f}% < 75%)")
            else:
                print(f"❌ Face {i} REJECTED: No registered student match (best distance: {best_distance:.3f}, tolerance: {tolerance}, confidence threshold: {confidence_threshold}%)")
        
        print(f"Media processing complete. Recognized: {len(recognized)} students")
        return JSONResponse(status_code=200, content={
            "recognized": recognized,
            "total_faces_detected": len(face_encodings),
            "attendance_marked": len(recognized)
        })
        
    except Exception as e:
        print(f"Error in media attendance processing: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/attendance")
def get_attendance():
    records = list(attendance_col.find())
    for r in records:
        r["_id"] = str(r["_id"])
        r["timestamp"] = r["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
    return records

@app.get("/attendance_by_hour")
def attendance_by_hour(
    hour: str = Query(..., description="Hour in format HH:00 (24h, e.g. 09:00)"),
    date: str = Query(None, description="Date in format YYYY-MM-DD (optional, defaults to today)")
):
    try:
        if date:
            day = datetime.strptime(date, "%Y-%m-%d").date()
        else:
            day = datetime.now().date()
        start_time = datetime.strptime(f"{day} {hour}", "%Y-%m-%d %H:%M")
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid date or hour format. Use YYYY-MM-DD and HH:00 (24h)"})

    end_time = start_time + timedelta(hours=1)

    students = list(students_col.find())
    roll_to_student = {s["roll"]: s for s in students}

    records = list(attendance_col.find({
        "timestamp": {"$gte": start_time, "$lt": end_time}
    }))
    present_rolls = {r["roll"] for r in records}

    present, absent = [], []

    for r in present_rolls:
        s = roll_to_student.get(r)
        if s:
            present.append({
                "roll": s["roll"],
                "name": s["name"],
                "photo_b64": s.get("photo_b64", None)
            })
            # ✅ Send WhatsApp "Present"
            send_whatsapp_message(
                s["phone"],
                f"Hello {s['name']} ({s['roll']}), your attendance for {hour} is marked as ✅ Present."
            )
        else:
            print(f"Warning: Student with roll {r} not found in students collection")

    for s in students:
        if s["roll"] not in present_rolls:
            absent.append({
                "roll": s["roll"],
                "name": s["name"],
                "photo_b64": s.get("photo_b64", None)
            })
            # ✅ Send WhatsApp "Absent"
            send_whatsapp_message(
                s["phone"],
                f"Hello {s['name']} ({s['roll']}), your attendance for {hour} is marked as ❌ Absent."
            )

    return {"present": present, "absent": absent}


@app.get("/students_full")
def get_students_full():
    students = list(students_col.find())
    for s in students:
        s["_id"] = str(s["_id"])
    return students

@app.put("/students/{student_id}")
def update_student(student_id: str, data: dict = Body(...)):
    # Allow updating all student fields except face_encoding and photo_b64
    allowed_fields = ["name", "roll", "specialization", "department", "section", "batch", "phone"]
    update_fields = {k: v for k, v in data.items() if k in allowed_fields}
    if not update_fields:
        return JSONResponse(status_code=400, content={"error": "No valid fields to update."})
    
    # Validate phone number format if phone is being updated
    if "phone" in update_fields:
        import re
        if not re.match(r"^\+\d{10,15}$", update_fields["phone"]):
            return JSONResponse(status_code=400, content={"error": "Invalid phone number format. Use +919876543210 style."})
    
    result = students_col.update_one({"_id": ObjectId(student_id)}, {"$set": update_fields})
    if result.matched_count == 0:
        return JSONResponse(status_code=404, content={"error": "Student not found."})
    return {"message": "Student updated."}

@app.delete("/students/{student_id}")
def delete_student(student_id: str):
    result = students_col.delete_one({"_id": ObjectId(student_id)})
    if result.deleted_count == 0:
        return JSONResponse(status_code=404, content={"error": "Student not found."})
    return {"message": "Student deleted."}

@app.delete("/attendance/clear_hour")
def clear_attendance_hour(
    hour: str = Query(..., description="Hour in format HH:00 (24h, e.g. 09:00)"),
    date: str = Query(None, description="Date in format YYYY-MM-DD (optional, defaults to today)")
):
    """Clear all attendance records for a specific hour - useful for fixing incorrect attendance"""
    try:
        if date:
            day = datetime.strptime(date, "%Y-%m-%d").date()
        else:
            day = datetime.now().date()
        start_time = datetime.strptime(f"{day} {hour}", "%Y-%m-%d %H:%M")
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid date or hour format. Use YYYY-MM-DD and HH:00 (24h)"})

    end_time = start_time + timedelta(hours=1)
    
    # Delete all attendance records for this hour
    result = attendance_col.delete_many({
        "timestamp": {"$gte": start_time, "$lt": end_time}
    })
    
    return {
        "message": f"Cleared {result.deleted_count} attendance records for {day} {hour}",
        "deleted_count": result.deleted_count
    } 

# Staff collection
staffs_col = db["staffs"]

@app.post("/signup_staff")
def signup_staff(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    specialization: str = Form(...),
    department: str = Form(...),
    section: str = Form(...),
    batch: str = Form(...)
):
    # Check duplicate email
    if staffs_col.find_one({"email": email}):
        return JSONResponse(status_code=400, content={"detail": "Email already registered."})

    staff = {
        "name": name,
        "email": email,
        "password": password,  # ⚠️ plain text for now (hash later!)
        "specialization": specialization,
        "department": department,
        "section": section,
        "batch": batch
    }

    staffs_col.insert_one(staff)
    return {"message": "Staff registered successfully."}


@app.post("/login_staff")
def login_staff(email: str = Form(...), password: str = Form(...)):
    staff = staffs_col.find_one({"email": email, "password": password})
    if not staff:
        return JSONResponse(status_code=401, content={"detail": "Invalid email or password."})

    # Return staff details (for frontend filters)
    return {
        "message": "Login successful",
        "name": staff["name"],
        "email": staff["email"],
        "specialization": staff["specialization"],
        "department": staff["department"],
        "section": staff["section"],
        "batch": staff["batch"]
    }

@app.post("/forgot_password")
def forgot_password(email: str = Form(...)):
    """Reset password for staff - simple implementation"""
    print(f"Looking for email: {email}")
    staff = staffs_col.find_one({"email": email})
    print(f"Found staff: {staff}")
    if not staff:
        return JSONResponse(status_code=404, content={"detail": "Email not found."})
    
    # For now, return success (in production, send reset link via email)
    return {"message": "Password reset instructions sent to your email."}

@app.post("/reset_password")
def reset_password(email: str = Form(...), new_password: str = Form(...)):
    """Update password for staff"""
    print(f"Resetting password for email: {email}")
    staff = staffs_col.find_one({"email": email})
    print(f"Found staff for reset: {staff}")
    if not staff:
        return JSONResponse(status_code=404, content={"detail": "Email not found."})
    
    # Update password
    result = staffs_col.update_one(
        {"email": email}, 
        {"$set": {"password": new_password}}
    )
    print(f"Update result: {result.modified_count} documents modified")
    
    return {"message": "Password updated successfully."}

@app.get("/staff_emails")
def get_staff_emails():
    """Debug endpoint to see all staff emails"""
    staffs = list(staffs_col.find({}, {"email": 1, "name": 1}))
    return {"staffs": staffs}

# FastAPI startup block
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)