from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.database import notices_collection
from app.auth import get_current_user, RoleChecker

router = APIRouter(
    prefix="/notices",
    tags=["Notices & Announcements"]
)

class NoticeCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    content: str = Field(..., min_length=5)
    category: str = Field(default="Academic")  # Exam, Academic, Holiday, Placement, Event, Urgent
    priority: str = Field(default="Normal")   # Normal, High, Urgent
    target_audience: str = Field(default="All") # All, Students, Faculty
    department: Optional[str] = "All Departments"
    is_pinned: bool = False

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    target_audience: Optional[str] = None
    department: Optional[str] = None
    is_pinned: Optional[bool] = None

# ==========================================
# Get All Notices (Public/All Roles)
# ==========================================
@router.get("")
async def get_notices(
    category: Optional[str] = None,
    audience: Optional[str] = None
):
    query = {}
    if category and category != "all":
        query["category"] = category
    if audience and audience != "all":
        query["target_audience"] = {"$in": ["All", audience]}

    notices = await notices_collection.find(query).sort([
        ("is_pinned", -1),
        ("created_at", -1)
    ]).to_list(100)

    for n in notices:
        n["_id"] = str(n["_id"])
        if "created_at" in n and isinstance(n["created_at"], datetime):
            n["created_at"] = n["created_at"].isoformat()

    return notices

# ==========================================
# Create Notice (Admin & Teacher)
# ==========================================
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_notice(
    notice: NoticeCreate,
    current_user: dict = Depends(RoleChecker(["admin", "teacher", "can_create_student"]))
):
    author_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip()
    if not author_name:
        author_name = current_user.get("email", "Administration")

    roles = current_user.get("role", [])
    if isinstance(roles, str):
        roles = [roles]
    author_role = "Dean / Admin" if "admin" in roles else "Faculty Professor"

    data = notice.model_dump()
    data.update({
        "author_id": current_user["_id"],
        "author_name": author_name,
        "author_role": author_role,
        "created_at": datetime.utcnow()
    })

    result = await notices_collection.insert_one(data)

    return {
        "message": "Notice published successfully",
        "id": str(result.inserted_id)
    }

# ==========================================
# Delete Notice (Admin Only)
# ==========================================
@router.delete("/{notice_id}")
async def delete_notice(
    notice_id: str,
    current_user: dict = Depends(RoleChecker(["admin", "can_create_student"]))
):
    try:
        obj_id = ObjectId(notice_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notice identifier")

    result = await notices_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notice not found")

    return {"message": "Notice deleted successfully"}

# ==========================================
# Toggle Pin Notice (Admin Only)
# ==========================================
@router.put("/{notice_id}/pin")
async def toggle_pin_notice(
    notice_id: str,
    current_user: dict = Depends(RoleChecker(["admin", "can_create_student"]))
):
    try:
        obj_id = ObjectId(notice_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notice identifier")

    notice = await notices_collection.find_one({"_id": obj_id})
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    new_pinned_state = not notice.get("is_pinned", False)
    await notices_collection.update_one(
        {"_id": obj_id},
        {"$set": {"is_pinned": new_pinned_state}}
    )

    return {
        "message": f"Notice {'pinned to top' if new_pinned_state else 'unpinned'}",
        "is_pinned": new_pinned_state
    }
