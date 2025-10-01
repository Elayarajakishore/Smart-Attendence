# This file can be expanded for more complex models or validation
from pymongo.collection import Collection
from typing import Dict

def insert_student(col: Collection, student: Dict):
    return col.insert_one(student)

def get_students(col: Collection):
    return list(col.find({}, {"face_encoding": 0}))

def insert_attendance(col: Collection, record: Dict):
    return col.insert_one(record)

def get_attendance(col: Collection):
    return list(col.find()) 