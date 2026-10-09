from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from app.models import CourseCreate
from fastapi import Query
import math

from app.auth import RoleChecker, hash_password

from app.database import (
    users_collection,
    courses_collection,
    attendance_collection,
    marks_collection
)


from app.schemas.user import UserRegister, UserUpdate


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(RoleChecker(["admin","can_create_student"]))]
)

# ==========================================
# Create User (Student / Teacher / Admin)
# ==========================================

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserRegister):

    existing = await users_collection.find_one(
        {"email": user.email}
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    data = user.model_dump()

    data["password"] = hash_password(data["password"])

    result = await users_collection.insert_one(data)

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
    user: UserUpdate
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

    result = await users_collection.update_one(
        {
            "_id": object_id
        },
        {
            "$set": data
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "message": "User updated successfully"
    }


# ==========================================
# Search + Pagination Users
# ==========================================

@router.get("/users/search")
async def search_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: str = Query("")
):

    query = {}

    if search:
        query = {
            "$or": [
                {
                    "first_name": {
                        "$regex": search,
                        "$options": "i"
                    }
                },
                {
                    "last_name": {
                        "$regex": search,
                        "$options": "i"
                    }
                },
                {
                    "email": {
                        "$regex": search,
                        "$options": "i"
                    }
                }
            ]
        }

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

        total_students = len(
            course.get("student_ids", [])
        )

        result.append(
            {
                "course": course.get("name") or course.get("course_name") or "Unnamed Course",
                "students": total_students,
                "teacher_id": course.get("teacher_id")
            }
        )

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