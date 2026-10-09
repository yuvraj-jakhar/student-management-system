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
    marks_collection,
    course_proposals_collection
)
from app.models import AttendanceRecord
from pydantic import BaseModel, Field
from typing import Optional

class CourseProposalCreate(BaseModel):
    name: str
    code: str
    department: str
    semester: int = Field(default=1, ge=1, le=8)
    credits: int = Field(default=4, ge=1, le=10)
    description: Optional[str] = None
    syllabus: Optional[str] = None

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
                "teacher_id": str(current_user["_id"])
            }
        ).to_list(100)

    for course in courses:
        course["_id"] = str(course["_id"])

    return courses


# =====================================
# Propose Course (Faculty Proposal)
# =====================================

@router.post("/courses/propose")
async def propose_course(
    proposal: CourseProposalCreate,
    current_user=Depends(RoleChecker(["teacher", "admin", "can_create_student"]))
):
    code_upper = proposal.code.strip().upper()
    existing_course = await courses_collection.find_one({"code": code_upper})
    if existing_course:
        raise HTTPException(status_code=400, detail=f"Course code '{code_upper}' already active")

    doc = {
        "name": proposal.name.strip(),
        "code": code_upper,
        "department": proposal.department.strip(),
        "semester": proposal.semester,
        "credits": proposal.credits,
        "description": proposal.description or "",
        "syllabus": proposal.syllabus or "",
        "teacher_id": str(current_user["_id"]),
        "teacher_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user.get("email"),
        "status": "pending",
        "created_at": datetime.utcnow()
    }

    res = await course_proposals_collection.insert_one(doc)
    return {
        "message": "Course proposal submitted for administrative approval",
        "id": str(res.inserted_id)
    }


# =====================================
# View Course Proposals
# =====================================

@router.get("/courses/proposals")
async def view_my_proposals(
    current_user=Depends(RoleChecker(["teacher", "admin", "can_create_student"]))
):
    user_roles = current_user.get("role", [])
    if isinstance(user_roles, str):
        user_roles = [user_roles]

    query = {}
    if "admin" not in user_roles and "can_create_student" not in user_roles:
        query["teacher_id"] = str(current_user["_id"])

    proposals = await course_proposals_collection.find(query).sort("created_at", -1).to_list(100)
    for p in proposals:
        p["_id"] = str(p["_id"])

    return proposals


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