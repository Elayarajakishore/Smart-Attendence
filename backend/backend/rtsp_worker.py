import time
import cv2
import numpy as np
import face_recognition
from datetime import datetime, timedelta
from threading import Event, Thread


class RtspAttendanceWorker:
    def __init__(self, rtsp_url, mongo_db, interval_ms=1000, frame_skip=0, start_after: datetime | None = None):
        self.rtsp_url = rtsp_url
        self.mongo_db = mongo_db
        self.interval_ms = max(200, int(interval_ms))
        self.frame_skip = max(0, int(frame_skip))
        self.start_after = start_after
        self.stop_event = Event()
        self.thread = None

        # runtime state for status endpoint
        self.running = False
        self.last_frame_ts = None
        self.last_error = None
        self.last_recognized = []

    def start(self):
        if self.thread and self.thread.is_alive():
            return False
        self.stop_event.clear()
        self.thread = Thread(target=self._run, daemon=True)
        self.thread.start()
        return True

    def stop(self):
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=5)
        self.running = False

    def status(self):
        return {
            "running": self.running,
            "last_frame_ts": self.last_frame_ts.isoformat() if self.last_frame_ts else None,
            "last_error": self.last_error,
            "last_recognized": self.last_recognized[-10:],
            "start_after": self.start_after.isoformat() if self.start_after else None,
        }

    def _run(self):
        cap = None
        self.running = True
        self.last_error = None
        frame_idx = 0

        # cache students for quick loop; refresh periodically
        students = []
        last_students_refresh = 0

        try:
            cap = cv2.VideoCapture(self.rtsp_url)
            if not cap.isOpened():
                self.last_error = "Failed to open RTSP stream"
                self.running = False
                return

            while not self.stop_event.is_set():
                # refresh students every 60s
                now_ts = time.time()
                if now_ts - last_students_refresh > 60:
                    students = list(self.mongo_db["students"].find())
                    last_students_refresh = now_ts

                ok, frame = cap.read()
                if not ok or frame is None:
                    self.last_error = "Frame read failed"
                    time.sleep(2)
                    continue

                frame_idx += 1
                if self.frame_skip and frame_idx % (self.frame_skip + 1) != 0:
                    # throttle via frame skipping
                    time.sleep(self.interval_ms / 1000.0)
                    continue

                self.last_frame_ts = datetime.now()

                try:
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    face_locations = face_recognition.face_locations(
                        rgb, number_of_times_to_upsample=1
                    )
                    face_encodings = face_recognition.face_encodings(rgb, face_locations)
                except Exception as e:
                    self.last_error = f"Face detection error: {e}"
                    time.sleep(self.interval_ms / 1000.0)
                    continue

                if not face_encodings:
                    time.sleep(self.interval_ms / 1000.0)
                    continue

                now = datetime.now()
                # schedule gate: do not mark before start_after
                if self.start_after and now < self.start_after:
                    time.sleep(self.interval_ms / 1000.0)
                    continue
                hour_start = now.replace(minute=0, second=0, microsecond=0)
                hour_end = hour_start + timedelta(hours=1)
                tolerance = 0.25
                confidence_threshold = 0.75

                recognized_this_frame = []

                for enc in face_encodings:
                    best = None
                    best_distance = float("inf")
                    best_conf = 0
                    for s in students:
                        try:
                            known = np.array(s["face_encoding"])
                            distance = face_recognition.face_distance([known], enc)[0]
                            conf = (1 - distance) * 100
                        except Exception:
                            continue
                        if distance < best_distance and distance <= tolerance and conf >= confidence_threshold:
                            best_distance = distance
                            best_conf = conf
                            best = s
                    if best:
                        exists = self.mongo_db["attendance"].find_one({
                            "roll": best["roll"],
                            "timestamp": {"$gte": hour_start, "$lt": hour_end}
                        })
                        if not exists:
                            try:
                                self.mongo_db["attendance"].insert_one({
                                    "roll": best["roll"],
                                    "name": best["name"],
                                    "timestamp": now,
                                    "confidence": best_conf,
                                    "source": "rtsp"
                                })
                            except Exception:
                                pass
                        recognized_this_frame.append({
                            "roll": best["roll"],
                            "name": best["name"],
                            "confidence": best_conf
                        })

                if recognized_this_frame:
                    self.last_recognized.extend(recognized_this_frame)
                    # keep memory bounded
                    if len(self.last_recognized) > 200:
                        self.last_recognized = self.last_recognized[-200:]

                time.sleep(self.interval_ms / 1000.0)

        finally:
            if cap is not None:
                try:
                    cap.release()
                except Exception:
                    pass
            self.running = False

