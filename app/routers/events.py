from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from bson import ObjectId
from bson.errors import InvalidId
from typing import Optional, List
from datetime import datetime

from app.auth import RoleChecker, get_current_user
from app.database import (
    events_collection,
    event_registrations_collection,
    users_collection,
    notifications_collection,
    log_audit_event
)
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventImportManualRequest,
    EventReviewRequest
)
from app.services.riet_website_sync import sync_riet_official_website
from app.services.instagram_sync import (
    import_manual_instagram_post,
    check_instagram_api_status
)

router = APIRouter(
    prefix="/events",
    tags=["Events & Campus Activities"]
)


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc["_id"] = str(doc["_id"])
    return doc


# ==========================================
# 1. Browse Events (All Authenticated Users)
# ==========================================

@router.get("")
async def get_events(
    search: str = Query(""),
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    source_filter: Optional[str] = Query(None), # all, in_house, external, instagram, riet_website
    time_filter: Optional[str] = Query(None), # all, upcoming, past
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1),
    current_user: dict = Depends(get_current_user)
):
    query = {}
    roles = current_user.get("role", [])
    if isinstance(roles, str):
        roles = [roles]
    is_admin = "admin" in roles

    # Non-admins do not see rejected events
    if not is_admin:
        query["review_status"] = {"$ne": "rejected"}

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"venue": {"$regex": search, "$options": "i"}},
            {"organizer": {"$regex": search, "$options": "i"}}
        ]
    if category and category.lower() != "all":
        query["category"] = {"$regex": category, "$options": "i"}
    if status_filter:
        query["status"] = status_filter

    if source_filter and source_filter.lower() != "all":
        if source_filter == "in_house":
            query["$or"] = [{"is_external": False}, {"is_external": {"$exists": False}}]
        elif source_filter == "external":
            query["is_external"] = True
        elif source_filter in ["instagram", "riet_website"]:
            query["source"] = source_filter

    now = datetime.utcnow()
    if time_filter == "upcoming":
        query["$or"] = [
            {"start_date": {"$gte": now}},
            {"is_date_unverified": True}
        ]
    elif time_filter == "past":
        query["end_date"] = {"$lt": now}
        query["is_date_unverified"] = {"$ne": True}

    total = await events_collection.count_documents(query)
    skip = (page - 1) * limit
    events = await events_collection.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    # Check which events current student is registered for
    user_id = str(current_user["_id"])
    my_regs = await event_registrations_collection.find(
        {"student_id": user_id, "status": "registered"},
        {"event_id": 1}
    ).to_list(100)
    registered_event_ids = {r["event_id"] for r in my_regs}

    formatted_events = []
    now = datetime.utcnow()
    for ev in events:
        d = _serialize(ev)
        d["is_registered"] = str(d["_id"]) in registered_event_ids
        deadline = ev.get("registration_deadline")
        d["is_expired"] = (now > deadline) if deadline else False
        cap = ev.get("capacity", 0)
        d["is_full"] = (ev.get("registered_count", 0) >= cap) if cap > 0 else False
        formatted_events.append(d)

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "events": formatted_events
    }


@router.get("/my-registrations")
async def get_my_event_registrations(
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    regs = await event_registrations_collection.find({"student_id": user_id, "status": "registered"}).sort("registered_at", -1).to_list(100)

    event_ids = [ObjectId(r["event_id"]) for r in regs if ObjectId.is_valid(r["event_id"])]
    events = await events_collection.find({"_id": {"$in": event_ids}}).to_list(100)
    events_map = {str(e["_id"]): _serialize(e) for e in events}

    result = []
    for r in regs:
        ev_id = r["event_id"]
        ev_info = events_map.get(ev_id, {})
        result.append({
            "registration_id": str(r["_id"]),
            "event_id": ev_id,
            "registered_at": r.get("registered_at"),
            "event": ev_info
        })

    return result


@router.get("/calendar")
async def get_calendar_events(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2030),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns events for interactive campus calendar view.
    """
    query = {"review_status": {"$ne": "rejected"}}
    events = await events_collection.find(query).sort("start_date", 1).to_list(200)

    formatted = []
    for ev in events:
        d = _serialize(ev)
        formatted.append(d)

    return formatted


@router.get("/{event_id}")
async def get_event_details(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(event_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Event ID")

    event = await events_collection.find_one({"_id": obj_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    user_id = str(current_user["_id"])
    reg = await event_registrations_collection.find_one({
        "event_id": event_id,
        "student_id": user_id,
        "status": "registered"
    })

    d = _serialize(event)
    d["is_registered"] = reg is not None
    return d


# ==========================================
# 2. Event Administration (Admin / Teacher / Organizer)
# ==========================================

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    current_user: dict = Depends(RoleChecker(["admin", "teacher"]))
):
    if event_in.start_date >= event_in.end_date:
        raise HTTPException(status_code=400, detail="Event start date must be before end date")

    doc = event_in.model_dump()
    doc["status"] = "published"
    doc["registered_count"] = 0
    doc["created_at"] = datetime.utcnow()
    doc["created_by"] = current_user.get("email")

    res = await events_collection.insert_one(doc)
    event_id = str(res.inserted_id)

    # Broadcast campus notification to all students
    await notifications_collection.insert_one({
        "target_role": "student",
        "title": f"New Event: {doc['title']}",
        "message": f"A new campus {doc['category']} '{doc['title']}' is scheduled at {doc['venue']}. Registrations are now open!",
        "category": "event",
        "link": f"/events",
        "created_at": datetime.utcnow(),
        "is_read": False
    })

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="CREATE_EVENT",
        resource_type="events",
        resource_id=event_id,
        details={"title": doc["title"], "category": doc["category"], "venue": doc["venue"]}
    )

    return {
        "message": "Event created and published successfully",
        "event_id": event_id
    }


@router.put("/{event_id}")
async def update_event(
    event_id: str,
    event_in: EventUpdate,
    current_user: dict = Depends(RoleChecker(["admin", "teacher"]))
):
    try:
        obj_id = ObjectId(event_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Event ID")

    existing = await events_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")

    data = event_in.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No changes provided")

    data["updated_at"] = datetime.utcnow()
    await events_collection.update_one({"_id": obj_id}, {"$set": data})

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="UPDATE_EVENT",
        resource_type="events",
        resource_id=event_id,
        details=data
    )

    return {"message": "Event updated successfully"}


@router.delete("/{event_id}")
async def cancel_event(
    event_id: str,
    current_user: dict = Depends(RoleChecker(["admin", "teacher"]))
):
    try:
        obj_id = ObjectId(event_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Event ID")

    result = await events_collection.update_one(
        {"_id": obj_id},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="CANCEL_EVENT",
        resource_type="events",
        resource_id=event_id,
        details={"status": "cancelled"}
    )

    return {"message": "Event cancelled successfully"}


# ==========================================
# 3. Student Registration & Cancellation
# ==========================================

@router.post("/{event_id}/register")
async def register_for_event(
    event_id: str,
    current_user: dict = Depends(RoleChecker(["student", "teacher", "admin"]))
):
    try:
        obj_id = ObjectId(event_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Event ID")

    event = await events_collection.find_one({"_id": obj_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.get("status") in ["cancelled", "completed"]:
        raise HTTPException(status_code=400, detail=f"Cannot register for {event.get('status')} event")

    now = datetime.utcnow()
    deadline = event.get("registration_deadline")
    if deadline and now > deadline:
        raise HTTPException(status_code=400, detail="Registration deadline for this event has passed")

    registered_count = event.get("registered_count", 0)
    capacity = event.get("capacity", 50)
    if registered_count >= capacity:
        raise HTTPException(status_code=400, detail="Event has reached maximum participant capacity")

    student_id = str(current_user["_id"])

    # Check existing registration
    existing_reg = await event_registrations_collection.find_one({
        "event_id": event_id,
        "student_id": student_id,
        "status": "registered"
    })
    if existing_reg:
        raise HTTPException(status_code=400, detail="You are already registered for this event")

    reg_doc = {
        "event_id": event_id,
        "event_title": event.get("title"),
        "student_id": student_id,
        "student_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user.get("email"),
        "student_email": current_user.get("email"),
        "student_enrollment": current_user.get("enrollment_no", "N/A"),
        "registered_at": now,
        "status": "registered"
    }

    res = await event_registrations_collection.insert_one(reg_doc)

    # Increment count atomically
    await events_collection.update_one(
        {"_id": obj_id},
        {"$inc": {"registered_count": 1}}
    )

    # Notify student
    await notifications_collection.insert_one({
        "user_id": student_id,
        "title": "Event Registration Confirmed",
        "message": f"You have successfully registered for '{event.get('title')}' on {event.get('start_date').strftime('%d %b %Y')}.",
        "category": "event",
        "created_at": datetime.utcnow(),
        "is_read": False
    })

    return {
        "message": "Registration successful",
        "registration_id": str(res.inserted_id)
    }


@router.post("/{event_id}/cancel")
async def cancel_registration(
    event_id: str,
    current_user: dict = Depends(RoleChecker(["student", "teacher", "admin"]))
):
    student_id = str(current_user["_id"])

    reg = await event_registrations_collection.find_one({
        "event_id": event_id,
        "student_id": student_id,
        "status": "registered"
    })
    if not reg:
        raise HTTPException(status_code=404, detail="No active registration found for this event")

    await event_registrations_collection.update_one(
        {"_id": reg["_id"]},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow()}}
    )

    try:
        obj_id = ObjectId(event_id)
        await events_collection.update_one(
            {"_id": obj_id, "registered_count": {"$gt": 0}},
            {"$inc": {"registered_count": -1}}
        )
    except Exception as e:
        print(f"Warning decrementing count: {e}")

    return {"message": "Event registration cancelled successfully"}


@router.get("/{event_id}/participants")
async def get_event_participants(
    event_id: str,
    current_user: dict = Depends(RoleChecker(["admin", "teacher"]))
):
    participants = await event_registrations_collection.find(
        {"event_id": event_id, "status": "registered"}
    ).sort("registered_at", 1).to_list(500)

    return [_serialize(p) for p in participants]


# ==========================================
# 5. External Official Sources & Sync APIs
# ==========================================

@router.get("/instagram/status")
async def get_instagram_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns official Instagram integration status (@riet_official)
    """
    return await check_instagram_api_status()


@router.post("/import/sync-riet-website")
async def trigger_riet_website_sync(
    current_user: dict = Depends(RoleChecker(["admin"]))
):
    """
    Synchronizes public news & events from RIET official website:
    https://www.rietjaipur.ac.in/newsevents/
    Includes duplicate detection and metadata preservation.
    """
    result = await sync_riet_official_website()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Website synchronization failed"))
    return result


@router.post("/import/manual")
async def import_manual_event(
    data: EventImportManualRequest,
    current_user: dict = Depends(RoleChecker(["admin"]))
):
    """
    Authorized Administrator imports an event from Instagram (@riet_official)
    or other official social media channel.
    Checks duplicate URL, creates record, and logs audit event.
    """
    admin_email = current_user.get("email", "admin@gmail.com")
    result = await import_manual_instagram_post(
        post_url=data.post_url,
        title=data.title,
        description=data.description,
        category=data.category or "Campus Life",
        banner_url=data.banner_url,
        venue=data.venue,
        start_date=data.start_date,
        organizer=data.organizer or "RIET Official (@riet_official)",
        is_date_unverified=data.is_date_unverified,
        is_venue_unverified=data.is_venue_unverified,
        admin_email=admin_email
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to import post. Possible duplicate.")
        )

    # If requested to notify students immediately
    if data.notify_students:
        ev = result["event"]
        await notifications_collection.insert_one({
            "target_role": "student",
            "title": f"New Campus Event: {ev['title']}",
            "message": f"Official RIET event update: {ev['title']}. Check details and pass availability on the portal.",
            "category": "event",
            "created_at": datetime.utcnow(),
            "is_read": False
        })

    return result


@router.get("/admin/pending-review")
async def get_pending_review_events(
    current_user: dict = Depends(RoleChecker(["admin"]))
):
    """
    Returns events that are in draft or pending review before publishing to students.
    """
    events = await events_collection.find(
        {"review_status": {"$in": ["pending_review", "draft"]}}
    ).sort("created_at", -1).to_list(100)
    return [_serialize(e) for e in events]


@router.put("/{event_id}/review")
async def review_event_status(
    event_id: str,
    review_data: EventReviewRequest,
    current_user: dict = Depends(RoleChecker(["admin"]))
):
    """
    Allows Admin to approve or reject an imported event.
    Optionally notifies students upon approval.
    """
    try:
        obj_id = ObjectId(event_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid event ID")

    event = await events_collection.find_one({"_id": obj_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    new_status = review_data.action # approved / rejected
    update_fields = {
        "review_status": new_status,
        "reviewed_by": current_user.get("email"),
        "reviewed_at": datetime.utcnow()
    }
    if review_data.remarks:
        update_fields["review_remarks"] = review_data.remarks

    await events_collection.update_one({"_id": obj_id}, {"$set": update_fields})

    # Log audit event
    await log_audit_event(
        user_id=str(current_user.get("_id", "admin")),
        user_email=current_user.get("email", "admin@gmail.com"),
        action=f"EVENT_REVIEW_{new_status.upper()}",
        resource_type="events",
        resource_id=event_id,
        details={"action": new_status, "remarks": review_data.remarks}
    )

    # Notify students if approved and requested
    if new_status == "approved" and review_data.notify_students:
        await notifications_collection.insert_one({
            "target_role": "student",
            "title": f"Official Event Published: {event.get('title')}",
            "message": f"RIET Campus Event '{event.get('title')}' is now active. View details on the Events portal.",
            "category": "event",
            "created_at": datetime.utcnow(),
            "is_read": False
        })

    return {
        "message": f"Event review updated to '{new_status}' successfully",
        "event_id": event_id,
        "review_status": new_status
    }
