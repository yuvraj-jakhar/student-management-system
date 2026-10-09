from fastapi import APIRouter, Depends, HTTPException
import qrcode
import uuid
import os

from datetime import datetime, timedelta

from app.database import qr_collection
from app.schemas.attendance import QRAttendance

from app.auth import RoleChecker
from app.database import (
    attendance_collection,
    courses_collection,
    marks_collection
)
from app.models import AttendanceRecord

router = APIRouter(
    prefix="/teacher",
    tags=["Teacher"],
    dependencies=[Depends(RoleChecker(["teacher", "admin", "can_create_student"]))]
)

# =====================================
# View Assigned Courses
# =====================================

@router.get("/courses")
async def view_courses(
    current_user=Depends(RoleChecker(["teacher", "admin", "can_create_student"]))
):
    user_roles = current_user.get("role", [])
    if isinstance(user_roles, str):
        user_roles = [user_roles]

    if "admin" in user_roles or "can_create_student" in user_roles:
        courses = await courses_collection.find().to_list(100)
    else:
        courses = await courses_collection.find(
            {
                "teacher_id": current_user["_id"]
            }
        ).to_list(100)

    for course in courses:
        course["_id"] = str(course["_id"])

    return courses


# =====================================
# Mark Attendance
# =====================================

@router.post("/attendance")
async def mark_attendance(
    attendance: AttendanceRecord
):

    result = await attendance_collection.insert_one(
        attendance.model_dump()
    )

    return {
        "message": "Attendance marked successfully",
        "id": str(result.inserted_id)
    }


# =====================================
# View Attendance
# =====================================

@router.get("/attendance")
async def view_attendance():

    records = await attendance_collection.find().to_list(100)

    for record in records:
        record["_id"] = str(record["_id"])

    return records
from app.models import MarksRecord

# =====================================
# Add Marks
# =====================================

@router.post("/marks")
async def add_marks(
    marks: MarksRecord
):

    result = await marks_collection.insert_one(
        marks.model_dump()
    )

    return {
        "message": "Marks added successfully",
        "id": str(result.inserted_id)
    }


# =====================================
# View Marks
# =====================================

@router.get("/marks")
async def view_marks():

    records = await marks_collection.find().to_list(100)

    for record in records:
        record["_id"] = str(record["_id"])

    return records


# =====================================
# Student Performance
# =====================================

@router.get("/performance")
async def student_performance():

    attendance = await attendance_collection.count_documents({})
    marks = await marks_collection.count_documents({})

    return {
        "attendance_records": attendance,
        "marks_records": marks
    }
    
    
# =====================================
# Generate QR Attendance
# =====================================

@router.post("/generate-qr")
async def generate_qr(data: QRAttendance):

    qr_id = str(uuid.uuid4())

    expire_time = datetime.utcnow() + timedelta(minutes=25)

    await qr_collection.insert_one(
        {
            "qr_id": qr_id,
            "course_id": data.course_id,
            "expire_at": expire_time
        }
    )

    img = qrcode.make(qr_id)

    filename = f"{qr_id}.png"

    path = os.path.join("uploads", filename)

    img.save(path)

    return {
        "message": "QR Generated Successfully",
        "qr_id": qr_id,
        "image": f"/uploads/{filename}",
        "expires_at": expire_time
    }