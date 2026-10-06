from fastapi import APIRouter, Depends, HTTPException

from datetime import datetime

from app.database import (
    attendance_collection,
    qr_collection
)

from app.auth import get_current_user

from app.auth import RoleChecker
from app.database import (
    courses_collection,
    attendance_collection,
    marks_collection
)

router = APIRouter(
    prefix="/student",
    tags=["Student"],
    dependencies=[Depends(RoleChecker(["student"]))]
)

# =====================================
# View Profile
# =====================================

@router.get("/profile")
async def view_profile(
    current_user=Depends(RoleChecker(["student"]))
):

    current_user.pop("password", None)

    return current_user


# =====================================
# View My Courses
# =====================================

@router.get("/courses")
async def view_courses(
    current_user=Depends(RoleChecker(["student"]))
):

    courses = await courses_collection.find(
        {
            "student_ids": current_user["_id"]
        }
    ).to_list(100)

    for course in courses:
        course["_id"] = str(course["_id"])

    return courses


# =====================================
# View My Attendance
# =====================================

@router.get("/attendance")
async def view_attendance(
    current_user=Depends(RoleChecker(["student"]))
):

    attendance = await attendance_collection.find(
        {
            "student_id": current_user["_id"]
        }
    ).to_list(100)

    for record in attendance:
        record["_id"] = str(record["_id"])

    return attendance


# =====================================
# View My Marks
# =====================================

@router.get("/marks")
async def view_marks(
    current_user=Depends(RoleChecker(["student"]))
):

    marks = await marks_collection.find(
        {
            "student_id": current_user["_id"]
        }
    ).to_list(100)

    for record in marks:
        record["_id"] = str(record["_id"])

    return marks

from app.schemas.attendance import ScanQR

# =====================================
# Scan QR & Mark Attendance
# =====================================

@router.post("/scan-qr")
async def scan_qr(
    data: ScanQR,
    current_user: dict = Depends(get_current_user)
):

    qr = await qr_collection.find_one(
        {
            "qr_id": data.qr_id
        }
    )

    if not qr:
        raise HTTPException(
            status_code=404,
            detail="QR Code Not Found"
        )

    # Expiry Check
    if datetime.utcnow() > qr["expire_at"]:
        raise HTTPException(
            status_code=400,
            detail="QR Code Expired"
        )

    # Duplicate Attendance Check
    already = await attendance_collection.find_one(
        {
            "student_id": current_user["_id"],
            "course_id": qr["course_id"]
        }
    )

    if already:
        raise HTTPException(
            status_code=400,
            detail="Attendance Already Marked"
        )

    # Save Attendance
    await attendance_collection.insert_one(
        {
            "student_id": current_user["_id"],
            "course_id": qr["course_id"],
            "status": "Present",
            "date": datetime.utcnow()
        }
    )

    return {
        "message": "Attendance Marked Successfully"
    }