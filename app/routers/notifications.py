from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from bson import ObjectId
from bson.errors import InvalidId
from typing import Optional, List
from datetime import datetime

from app.auth import RoleChecker, get_current_user
from app.database import notifications_collection
from app.schemas.notification import NotificationCreate

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications System"]
)


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc["_id"] = str(doc["_id"])
    return doc


@router.get("")
async def get_my_notifications(
    limit: int = Query(30, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    roles = current_user.get("role", [])
    if isinstance(roles, str):
        roles = [roles]

    query = {
        "$or": [
            {"user_id": user_id},
            {"target_role": {"$in": roles}},
            {"target_role": "all"},
            {"$and": [{"user_id": None}, {"target_role": None}]}
        ]
    }

    notifs = await notifications_collection.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [_serialize(n) for n in notifs]


@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    roles = current_user.get("role", [])
    if isinstance(roles, str):
        roles = [roles]

    query = {
        "is_read": False,
        "$or": [
            {"user_id": user_id},
            {"target_role": {"$in": roles}},
            {"target_role": "all"},
            {"$and": [{"user_id": None}, {"target_role": None}]}
        ]
    }

    count = await notifications_collection.count_documents(query)
    return {"unread_count": count}


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(notification_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Notification ID")

    await notifications_collection.update_one(
        {"_id": obj_id},
        {"$set": {"is_read": True}}
    )

    return {"message": "Notification marked as read"}


@router.put("/mark-all-read")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    roles = current_user.get("role", [])
    if isinstance(roles, str):
        roles = [roles]

    query = {
        "is_read": False,
        "$or": [
            {"user_id": user_id},
            {"target_role": {"$in": roles}},
            {"target_role": "all"}
        ]
    }

    await notifications_collection.update_many(
        query,
        {"$set": {"is_read": True}}
    )

    return {"message": "All notifications marked as read"}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_broadcast_notification(
    notif: NotificationCreate,
    current_user: dict = Depends(RoleChecker(["admin"]))
):
    doc = notif.model_dump()
    doc["created_at"] = datetime.utcnow()
    doc["is_read"] = False
    doc["created_by"] = current_user.get("email")

    res = await notifications_collection.insert_one(doc)
    return {
        "message": "Notification broadcast created successfully",
        "id": str(res.inserted_id)
    }
