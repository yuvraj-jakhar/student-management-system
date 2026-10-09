from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Response, Body
from bson import ObjectId
from bson.errors import InvalidId
from typing import Optional, List
from datetime import datetime
import math

from app.models import CourseCreate
from app.auth import RoleChecker, hash_password, get_current_user
from app.database import (
    users_collection,
    courses_collection,
    attendance_collection,
    marks_collection,
    course_proposals_collection,
    log_audit_event
)
from app.schemas.user import UserRegister, UserUpdate
from app.services.student_import import (
    generate_template,
    parse_and_validate_student_rows
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(RoleChecker(["admin", "can_create_student"]))]
)

# ==========================================
# Create User (Student / Teacher / Admin)
# ==========================================

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserRegister,
    current_user: dict = Depends(get_current_user)
):
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    if user.enrollment_no:
        existing_enr = await users_collection.find_one({"enrollment_no": user.enrollment_no})
        if existing_enr:
            raise HTTPException(
                status_code=400,
                detail=f"Enrollment number '{user.enrollment_no}' already exists"
            )

    data = user.model_dump()
    data["password"] = hash_password(data["password"])
    if data.get("is_active") is None:
        data["is_active"] = True
    data["created_at"] = datetime.utcnow()

    result = await users_collection.insert_one(data)

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="CREATE_USER",
        resource_type="users",
        resource_id=str(result.inserted_id),
        details={"created_email": user.email, "roles": [r.value if hasattr(r, 'value') else r for r in user.role]}
    )

    return {
        "message": "User created successfully",
        "roles": user.role,
        "id": str(result.inserted_id)
    }


# ==========================================
# Get All Users
# ==========================================

@router.get("/users")
async def get_users():

    users = await users_collection.find().to_list(100)

    for user in users:
        user["_id"] = str(user["_id"])
        user.pop("password", None)

    return users


# ==========================================
# Delete User
# ==========================================

@router.delete("/users/{user_id}")
async def delete_user(user_id: str):

    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid User ID"
        )

    result = await users_collection.delete_one(
        {"_id": object_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "message": "User deleted successfully"
    }


# ==========================================
# Create Course
# ==========================================

@router.post("/courses")
async def create_course(course: CourseCreate):

    result = await courses_collection.insert_one(
        course.model_dump()
    )

    return {
        "message": "Course created successfully",
        "course_id": str(result.inserted_id)
    }


# ==========================================
# Get Courses
# ==========================================

@router.get("/courses")
async def get_courses():

    courses = await courses_collection.find().to_list(100)

    for course in courses:
        course["_id"] = str(course["_id"])

    return courses


# ==========================================
# Delete Course
# ==========================================

@router.delete("/courses/{course_id}")
async def delete_course(course_id: str):

    result = await courses_collection.delete_one(
        {"_id": ObjectId(course_id)}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    return {
        "message": "Course deleted successfully"
    }


# ==========================================
# Assign Teacher
# ==========================================

@router.put("/courses/{course_id}/assign/{teacher_id}")
async def assign_teacher(course_id: str, teacher_id: str):

    result = await courses_collection.update_one(
        {"_id": ObjectId(course_id)},
        {
            "$set": {
                "teacher_id": teacher_id
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    return {
        "message": "Teacher assigned successfully"
    }


# ==========================================
# Enroll Student
# ==========================================

@router.put("/courses/{course_id}/enroll/{student_id}")
async def enroll_student(course_id: str, student_id: str):

    result = await courses_collection.update_one(
        {"_id": ObjectId(course_id)},
        {
            "$addToSet": {
                "student_ids": student_id
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    return {
        "message": "Student enrolled successfully"
    }
    
# ==========================================
# Analytics Dashboard
# ==========================================

@router.get("/dashboard")
async def dashboard():

    total_students = await users_collection.count_documents(
    {
        "role": {
            "$in": ["student"]
        }
    }
)

    total_teachers = await users_collection.count_documents(
    {
        "role": {
            "$in": ["teacher"]
        }
    }
    )

    total_admins = await users_collection.count_documents(
    {
        "role": {
            "$in": ["admin"]
        }
    }
)

    total_courses = await courses_collection.count_documents({})

    total_attendance = await attendance_collection.count_documents({})

    total_marks = await marks_collection.count_documents({})

    # Attendance Percentage
    attendance_percentage = 0

    if total_students > 0:
        attendance_percentage = round(
            (total_attendance / total_students) * 100,
            2
        )

    # Top Students
    top_students = await marks_collection.find().sort(
        "marks",
        -1
    ).limit(5).to_list(5)

    return {
        "statistics": {
            "students": total_students,
            "teachers": total_teachers,
            "admins": total_admins,
            "courses": total_courses,
            "attendance_records": total_attendance,
            "marks_records": total_marks,
            "attendance_percentage": attendance_percentage
        },
        "top_students": top_students
    }
from fastapi import Body

# ==========================================
# Update User
# ==========================================

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid User ID"
        )

    data = user.model_dump(exclude_none=True)

    if not data:
        raise HTTPException(
            status_code=400,
            detail="No data provided"
        )

    # Check enrollment uniqueness if updating
    if "enrollment_no" in data and data["enrollment_no"]:
        conflict = await users_collection.find_one({
            "enrollment_no": data["enrollment_no"],
            "_id": {"$ne": object_id}
        })
        if conflict:
            raise HTTPException(
                status_code=400,
                detail=f"Enrollment number '{data['enrollment_no']}' already assigned to another user"
            )

    result = await users_collection.update_one(
        {"_id": object_id},
        {"$set": data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="UPDATE_USER",
        resource_type="users",
        resource_id=user_id,
        details={k: v for k, v in data.items() if k != "password"}
    )

    return {
        "message": "User updated successfully"
    }


# ==========================================
# Toggle User Active Status
# ==========================================

@router.put("/users/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid User ID")

    is_active = bool(payload.get("is_active", True))
    result = await users_collection.update_one(
        {"_id": object_id},
        {"$set": {"is_active": is_active}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="TOGGLE_USER_STATUS",
        resource_type="users",
        resource_id=user_id,
        details={"is_active": is_active}
    )

    return {
        "message": f"User {'activated' if is_active else 'deactivated'} successfully",
        "is_active": is_active
    }


# ==========================================
# Search + Pagination Users
# ==========================================

@router.get("/users/search")
async def search_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: str = Query(""),
    role: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None)
):
    query = {}

    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"enrollment_no": {"$regex": search, "$options": "i"}},
            {"department": {"$regex": search, "$options": "i"}}
        ]

    if role:
        query["role"] = {"$in": [role]}

    if department:
        query["department"] = {"$regex": department, "$options": "i"}

    if semester is not None:
        query["semester"] = semester

    if is_active is not None:
        query["is_active"] = is_active

    total = await users_collection.count_documents(query)
    skip = (page - 1) * limit
    users = await users_collection.find(query).skip(skip).limit(limit).to_list(limit)

    for user in users:
        user["_id"] = str(user["_id"])
        user.pop("password", None)

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": math.ceil(total / limit) if total else 1,
        "users": users
    }


# ==========================================
# Bulk Import Students: Template Download
# ==========================================

@router.get("/students/import-template")
async def download_import_template(
    format: str = Query("csv", pattern="^(csv|xlsx)$")
):
    file_bytes, media_type, filename = generate_template(format)
    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ==========================================
# Bulk Import Students: Preview & Validate
# ==========================================

@router.post("/students/import-preview")
async def preview_student_import(
    file: UploadFile = File(...)
):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    existing_users = await users_collection.find({}, {"email": 1, "enrollment_no": 1}).to_list(10000)
    existing_emails = {u.get("email", "").lower() for u in existing_users if u.get("email")}
    existing_enrollments = {u.get("enrollment_no", "").upper() for u in existing_users if u.get("enrollment_no")}

    result = parse_and_validate_student_rows(
        file_bytes=contents,
        filename=file.filename,
        existing_emails=existing_emails,
        existing_enrollments=existing_enrollments
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to parse file"))

    return result


# ==========================================
# Bulk Import Students: Commit
# ==========================================

@router.post("/students/import")
async def commit_student_import(
    file: UploadFile = File(...),
    skip_invalid: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    existing_users = await users_collection.find({}, {"email": 1, "enrollment_no": 1}).to_list(10000)
    existing_emails = {u.get("email", "").lower() for u in existing_users if u.get("email")}
    existing_enrollments = {u.get("enrollment_no", "").upper() for u in existing_users if u.get("enrollment_no")}

    result = parse_and_validate_student_rows(
        file_bytes=contents,
        filename=file.filename,
        existing_emails=existing_emails,
        existing_enrollments=existing_enrollments
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to parse file"))

    valid_rows = [r for r in result["rows"] if r["is_valid"]]
    invalid_rows = [r for r in result["rows"] if not r["is_valid"]]

    if not valid_rows and not skip_invalid:
        raise HTTPException(status_code=400, detail="No valid student records found in file")

    if not skip_invalid and invalid_rows:
        raise HTTPException(
            status_code=400,
            detail=f"Import aborted: {len(invalid_rows)} row(s) contain validation errors."
        )

    inserted_ids = []
    default_password_hash = hash_password("123456")

    for row in valid_rows:
        data = row["data"].copy()
        data["role"] = ["student"]
        data["password"] = default_password_hash
        data["is_active"] = True
        data["created_at"] = datetime.utcnow()
        res = await users_collection.insert_one(data)
        inserted_ids.append(str(res.inserted_id))

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="BULK_IMPORT_STUDENTS",
        resource_type="users",
        resource_id=None,
        details={
            "filename": file.filename,
            "imported_count": len(inserted_ids),
            "skipped_count": len(invalid_rows)
        }
    )

    return {
        "message": f"Successfully imported {len(inserted_ids)} students.",
        "imported_count": len(inserted_ids),
        "skipped_count": len(invalid_rows),
        "invalid_rows": invalid_rows
    }


# ==========================================
# Course Proposals Review (Admin)
# ==========================================

@router.get("/courses/proposals")
async def get_course_proposals(
    status: Optional[str] = Query(None)
):
    query = {}
    if status:
        query["status"] = status
    proposals = await course_proposals_collection.find(query).sort("created_at", -1).to_list(100)
    for p in proposals:
        p["_id"] = str(p["_id"])
    return proposals


@router.put("/courses/proposals/{proposal_id}/review")
async def review_course_proposal(
    proposal_id: str,
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(proposal_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Proposal ID")

    action = payload.get("action")  # "approved" or "rejected"
    admin_remarks = payload.get("remarks", "")

    if action not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Action must be 'approved' or 'rejected'")

    proposal = await course_proposals_collection.find_one({"_id": obj_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    update_fields = {
        "status": action,
        "reviewed_by": current_user.get("email"),
        "reviewed_at": datetime.utcnow(),
        "admin_remarks": admin_remarks
    }
    await course_proposals_collection.update_one({"_id": obj_id}, {"$set": update_fields})

    course_id = None
    if action == "approved":
        course_data = {
            "name": proposal.get("name"),
            "course_name": proposal.get("name"),
            "code": proposal.get("code"),
            "course_code": proposal.get("code"),
            "department": proposal.get("department"),
            "semester": proposal.get("semester", 1),
            "credits": proposal.get("credits", 4),
            "description": proposal.get("description", ""),
            "teacher_id": proposal.get("teacher_id"),
            "student_ids": [],
            "created_at": datetime.utcnow()
        }
        c_res = await courses_collection.insert_one(course_data)
        course_id = str(c_res.inserted_id)

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action=f"COURSE_PROPOSAL_{action.upper()}",
        resource_type="course_proposals",
        resource_id=proposal_id,
        details={"code": proposal.get("code"), "created_course_id": course_id}
    )

    return {
        "message": f"Proposal {action} successfully",
        "course_id": course_id
    }


# ==========================================
# Student Leaderboard
# ==========================================

@router.get("/leaderboard")
async def leaderboard():
    leaderboard = await marks_collection.find().sort(
        "marks",
        -1
    ).limit(10).to_list(10)
    return leaderboard


# ==========================================
# Course Statistics
# ==========================================

@router.get("/course-stats")
async def course_statistics():
    courses = await courses_collection.find().to_list(100)
    result = []
    for course in courses:
        total_students = len(course.get("student_ids", []))
        result.append({
            "course": course.get("name") or course.get("course_name") or "Unnamed Course",
            "students": total_students,
            "teacher_id": course.get("teacher_id")
        })
    return result


# ==========================================
# Recent Attendance
# ==========================================

@router.get("/recent-attendance")
async def recent_attendance():
    records = await attendance_collection.find().sort(
        "date",
        -1
    ).limit(20).to_list(20)

    for record in records:
        record["_id"] = str(record["_id"])

    return records