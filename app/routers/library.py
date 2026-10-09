from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from bson import ObjectId
from bson.errors import InvalidId
from typing import Optional, List
from datetime import datetime, timedelta

from app.auth import RoleChecker, get_current_user
from app.database import (
    library_books_collection,
    library_issues_collection,
    users_collection,
    notifications_collection,
    log_audit_event
)
from app.schemas.library import (
    BookCreate,
    BookUpdate,
    BookIssueRequest,
    BookReturnRequest,
    BookRenewRequest
)

router = APIRouter(
    prefix="/library",
    tags=["Library Management"]
)

DAILY_FINE_RATE = 5.0  # Rs 5 per day late


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc["_id"] = str(doc["_id"])
    return doc


# ==========================================
# 1. Books Catalogue (Open to all authenticated users)
# ==========================================

@router.get("/books")
async def get_books(
    search: str = Query(""),
    category: Optional[str] = Query(None),
    available_only: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1),
    current_user: dict = Depends(get_current_user)
):
    query = {"is_active": {"$ne": False}}

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}},
            {"isbn": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
            {"publisher": {"$regex": search, "$options": "i"}}
        ]

    if category:
        query["category"] = {"$regex": category, "$options": "i"}

    if available_only:
        query["available_copies"] = {"$gt": 0}

    total = await library_books_collection.count_documents(query)
    skip = (page - 1) * limit
    books = await library_books_collection.find(query).sort("title", 1).skip(skip).limit(limit).to_list(limit)

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "books": [_serialize(b) for b in books]
    }


@router.get("/books/{book_id}")
async def get_book_details(
    book_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(book_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Book ID")

    book = await library_books_collection.find_one({"_id": obj_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    return _serialize(book)


# ==========================================
# 2. Book Management (Librarian / Admin)
# ==========================================

@router.post("/books", status_code=status.HTTP_201_CREATED)
async def create_book(
    book_in: BookCreate,
    current_user: dict = Depends(RoleChecker(["librarian", "admin"]))
):
    clean_isbn = book_in.isbn.strip().replace("-", "").upper()

    existing = await library_books_collection.find_one({"isbn": clean_isbn})
    if existing:
        raise HTTPException(status_code=400, detail=f"Book with ISBN '{book_in.isbn}' already registered")

    doc = book_in.model_dump()
    doc["isbn"] = clean_isbn
    doc["available_copies"] = doc["total_copies"]
    doc["is_active"] = True
    doc["created_at"] = datetime.utcnow()
    doc["created_by"] = current_user.get("email")

    res = await library_books_collection.insert_one(doc)

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="ADD_LIBRARY_BOOK",
        resource_type="library_books",
        resource_id=str(res.inserted_id),
        details={"title": doc["title"], "isbn": clean_isbn, "copies": doc["total_copies"]}
    )

    return {
        "message": "Book added to catalogue successfully",
        "book_id": str(res.inserted_id)
    }


@router.put("/books/{book_id}")
async def update_book(
    book_id: str,
    book_in: BookUpdate,
    current_user: dict = Depends(RoleChecker(["librarian", "admin"]))
):
    try:
        obj_id = ObjectId(book_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Book ID")

    existing = await library_books_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Book not found")

    data = book_in.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No changes provided")

    # If updating ISBN, check uniqueness
    if "isbn" in data:
        clean_isbn = data["isbn"].strip().replace("-", "").upper()
        conflict = await library_books_collection.find_one({"isbn": clean_isbn, "_id": {"$ne": obj_id}})
        if conflict:
            raise HTTPException(status_code=400, detail=f"ISBN '{data['isbn']}' belongs to another book")
        data["isbn"] = clean_isbn

    # If total_copies updated, adjust available_copies safely
    if "total_copies" in data:
        delta = data["total_copies"] - existing.get("total_copies", 0)
        new_avail = existing.get("available_copies", 0) + delta
        if new_avail < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reduce total copies below currently issued copies ({existing.get('total_copies', 0) - existing.get('available_copies', 0)} currently checked out)"
            )
        data["available_copies"] = new_avail

    data["updated_at"] = datetime.utcnow()

    await library_books_collection.update_one({"_id": obj_id}, {"$set": data})

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="UPDATE_LIBRARY_BOOK",
        resource_type="library_books",
        resource_id=book_id,
        details=data
    )

    return {"message": "Book catalogue record updated successfully"}


@router.delete("/books/{book_id}")
async def deactivate_book(
    book_id: str,
    current_user: dict = Depends(RoleChecker(["librarian", "admin"]))
):
    try:
        obj_id = ObjectId(book_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Book ID")

    # Check active issues
    active_issues = await library_issues_collection.count_documents({
        "book_id": book_id,
        "status": {"$in": ["issued", "renewed"]}
    })
    if active_issues > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot deactivate book with {active_issues} currently checked-out active issue(s)"
        )

    await library_books_collection.update_one(
        {"_id": obj_id},
        {"$set": {"is_active": False, "deactivated_at": datetime.utcnow()}}
    )

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="DEACTIVATE_LIBRARY_BOOK",
        resource_type="library_books",
        resource_id=book_id,
        details={"status": "deactivated"}
    )

    return {"message": "Book deactivated successfully"}


# ==========================================
# 3. Circulation Operations (Issue, Return, Renew)
# ==========================================

@router.post("/issue")
async def issue_book(
    req: BookIssueRequest,
    current_user: dict = Depends(RoleChecker(["librarian", "admin"]))
):
    try:
        book_obj_id = ObjectId(req.book_id)
        student_obj_id = ObjectId(req.student_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Book ID or Student ID")

    # 1. Book check
    book = await library_books_collection.find_one({"_id": book_obj_id, "is_active": {"$ne": False}})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found or deactivated")

    if book.get("available_copies", 0) <= 0:
        raise HTTPException(status_code=400, detail=f"No copies currently available for '{book.get('title')}'")

    # 2. Student check
    student = await users_collection.find_one({"_id": student_obj_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not student.get("is_active", True):
        raise HTTPException(status_code=400, detail="Student account is deactivated. Cannot issue books.")

    # 3. Prevent duplicate active checkout of the same book
    existing_issue = await library_issues_collection.find_one({
        "book_id": req.book_id,
        "student_id": req.student_id,
        "status": {"$in": ["issued", "renewed"]}
    })
    if existing_issue:
        raise HTTPException(status_code=400, detail="Student already has an active copy of this book checked out")

    # 4. Enforce max active books per student (max 5)
    active_count = await library_issues_collection.count_documents({
        "student_id": req.student_id,
        "status": {"$in": ["issued", "renewed"]}
    })
    if active_count >= 5:
        raise HTTPException(status_code=400, detail="Student has reached the maximum borrowing limit (5 books)")

    issue_date = datetime.utcnow()
    due_date = issue_date + timedelta(days=req.due_days)

    issue_doc = {
        "book_id": req.book_id,
        "book_title": book.get("title"),
        "book_isbn": book.get("isbn"),
        "student_id": req.student_id,
        "student_name": f"{student.get('first_name', '')} {student.get('last_name', '')}".strip() or student.get("email"),
        "student_email": student.get("email"),
        "student_enrollment": student.get("enrollment_no", "N/A"),
        "issued_by": current_user.get("email"),
        "issue_date": issue_date,
        "due_date": due_date,
        "return_date": None,
        "status": "issued",
        "renew_count": 0,
        "fine_amount": 0.0,
        "notes": req.notes or ""
    }

    # Decrement available copies atomically
    await library_books_collection.update_one(
        {"_id": book_obj_id, "available_copies": {"$gt": 0}},
        {"$inc": {"available_copies": -1}}
    )

    res = await library_issues_collection.insert_one(issue_doc)

    # Automated student notification
    await notifications_collection.insert_one({
        "user_id": req.student_id,
        "title": "Book Issued",
        "message": f"'{book.get('title')}' has been issued to you. Due date: {due_date.strftime('%d %b %Y')}.",
        "category": "library",
        "created_at": datetime.utcnow(),
        "is_read": False
    })

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="ISSUE_BOOK",
        resource_type="library_issues",
        resource_id=str(res.inserted_id),
        details={"book_title": book.get("title"), "student": student.get("email"), "due_date": due_date.isoformat()}
    )

    return {
        "message": "Book issued successfully",
        "issue_id": str(res.inserted_id),
        "due_date": due_date
    }


@router.post("/return")
async def return_book(
    req: BookReturnRequest,
    current_user: dict = Depends(RoleChecker(["librarian", "admin"]))
):
    try:
        issue_obj_id = ObjectId(req.issue_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Issue ID")

    issue = await library_issues_collection.find_one({"_id": issue_obj_id})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")

    if issue.get("status") == "returned":
        raise HTTPException(status_code=400, detail="This book has already been marked as returned")

    now = datetime.utcnow()
    due_date = issue.get("due_date", now)
    fine = 0.0

    if now > due_date:
        days_late = (now - due_date).days
        fine = round(max(0, days_late) * DAILY_FINE_RATE, 2)

    await library_issues_collection.update_one(
        {"_id": issue_obj_id},
        {
            "$set": {
                "status": "returned",
                "return_date": now,
                "fine_amount": fine,
                "returned_to": current_user.get("email"),
                "remarks": req.remarks or ""
            }
        }
    )

    # Restore inventory
    try:
        book_obj_id = ObjectId(issue["book_id"])
        await library_books_collection.update_one(
            {"_id": book_obj_id},
            {"$inc": {"available_copies": 1}}
        )
    except Exception as e:
        print(f"Warning restoring book inventory: {e}")

    # Notify student
    await notifications_collection.insert_one({
        "user_id": issue.get("student_id"),
        "title": "Book Returned",
        "message": f"'{issue.get('book_title')}' has been returned." + (f" Overdue fine: ₹{fine}" if fine > 0 else ""),
        "category": "library",
        "created_at": datetime.utcnow(),
        "is_read": False
    })

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="RETURN_BOOK",
        resource_type="library_issues",
        resource_id=req.issue_id,
        details={"fine_amount": fine, "student": issue.get("student_email")}
    )

    return {
        "message": "Book returned successfully",
        "fine_amount": fine,
        "is_overdue": fine > 0
    }


@router.post("/renew")
async def renew_book(
    req: BookRenewRequest,
    current_user: dict = Depends(RoleChecker(["librarian", "admin"]))
):
    try:
        issue_obj_id = ObjectId(req.issue_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Issue ID")

    issue = await library_issues_collection.find_one({"_id": issue_obj_id})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")

    if issue.get("status") == "returned":
        raise HTTPException(status_code=400, detail="Cannot renew an already returned book")

    renew_count = issue.get("renew_count", 0)
    if renew_count >= 2:
        raise HTTPException(status_code=400, detail="Maximum renewal limit reached (2 renewals)")

    current_due = issue.get("due_date", datetime.utcnow())
    base_date = max(current_due, datetime.utcnow())
    new_due = base_date + timedelta(days=req.additional_days)

    await library_issues_collection.update_one(
        {"_id": issue_obj_id},
        {
            "$set": {
                "due_date": new_due,
                "status": "renewed"
            },
            "$inc": {
                "renew_count": 1
            }
        }
    )

    await log_audit_event(
        user_id=current_user.get("_id"),
        user_email=current_user.get("email"),
        action="RENEW_BOOK",
        resource_type="library_issues",
        resource_id=req.issue_id,
        details={"new_due_date": new_due.isoformat(), "renew_count": renew_count + 1}
    )

    return {
        "message": f"Book renewed successfully for {req.additional_days} days",
        "new_due_date": new_due
    }


# ==========================================
# 4. Student View (Personal circulation)
# ==========================================

@router.get("/my-books")
async def get_my_books(
    current_user: dict = Depends(get_current_user)
):
    student_id = str(current_user["_id"])
    issues = await library_issues_collection.find({"student_id": student_id}).sort("issue_date", -1).to_list(100)

    now = datetime.utcnow()
    results = []
    for issue in issues:
        doc = _serialize(issue)
        if doc.get("status") in ["issued", "renewed"]:
            due_date = doc.get("due_date")
            if due_date and now > due_date:
                days_overdue = (now - due_date).days
                doc["is_overdue"] = True
                doc["days_overdue"] = days_overdue
                doc["current_fine"] = round(days_overdue * DAILY_FINE_RATE, 2)
            else:
                doc["is_overdue"] = False
                doc["days_overdue"] = 0
                doc["current_fine"] = 0.0
        results.append(doc)

    return results


# ==========================================
# 5. Admin & Librarian Circulation Records & Reports
# ==========================================

@router.get("/issues")
async def get_all_issues(
    status_filter: Optional[str] = Query(None),
    search: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1),
    current_user: dict = Depends(RoleChecker(["librarian", "admin"]))
):
    query = {}
    if status_filter:
        query["status"] = status_filter
    if search:
        query["$or"] = [
            {"book_title": {"$regex": search, "$options": "i"}},
            {"student_name": {"$regex": search, "$options": "i"}},
            {"student_email": {"$regex": search, "$options": "i"}},
            {"student_enrollment": {"$regex": search, "$options": "i"}}
        ]

    total = await library_issues_collection.count_documents(query)
    skip = (page - 1) * limit
    issues = await library_issues_collection.find(query).sort("issue_date", -1).skip(skip).limit(limit).to_list(limit)

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "issues": [_serialize(i) for i in issues]
    }


@router.get("/overdue")
async def get_overdue_books(
    current_user: dict = Depends(RoleChecker(["librarian", "admin"]))
):
    now = datetime.utcnow()
    query = {
        "status": {"$in": ["issued", "renewed"]},
        "due_date": {"$lt": now}
    }

    overdue_issues = await library_issues_collection.find(query).sort("due_date", 1).to_list(200)

    results = []
    for item in overdue_issues:
        doc = _serialize(item)
        due = doc.get("due_date")
        days_late = (now - due).days if due else 0
        doc["days_overdue"] = max(1, days_late)
        doc["fine_calculated"] = round(doc["days_overdue"] * DAILY_FINE_RATE, 2)
        results.append(doc)

    return results


@router.get("/stats")
async def get_library_stats(
    current_user: dict = Depends(get_current_user)
):
    total_titles = await library_books_collection.count_documents({"is_active": {"$ne": False}})
    active_issues = await library_issues_collection.count_documents({"status": {"$in": ["issued", "renewed"]}})
    now = datetime.utcnow()
    overdue_count = await library_issues_collection.count_documents({
        "status": {"$in": ["issued", "renewed"]},
        "due_date": {"$lt": now}
    })

    # Total inventory copies
    pipeline = [
        {"$match": {"is_active": {"$ne": False}}},
        {"$group": {"_id": None, "total_copies": {"$sum": "$total_copies"}, "available_copies": {"$sum": "$available_copies"}}}
    ]
    aggregate_res = await library_books_collection.aggregate(pipeline).to_list(1)
    total_copies = aggregate_res[0]["total_copies"] if aggregate_res else 0
    available_copies = aggregate_res[0]["available_copies"] if aggregate_res else 0

    return {
        "total_titles": total_titles,
        "total_copies": total_copies,
        "available_copies": available_copies,
        "active_issues": active_issues,
        "overdue_count": overdue_count
    }
