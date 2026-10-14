from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from datetime import datetime
import certifi

# Connect with SSL CA bundle support for Cloud MongoDB Atlas
client_kwargs = {}
if "mongodb+srv://" in settings.MONGO_URL or "ssl=true" in settings.MONGO_URL.lower() or "tls=true" in settings.MONGO_URL.lower():
    client_kwargs["tlsCAFile"] = certifi.where()

client = AsyncIOMotorClient(settings.MONGO_URL, **client_kwargs)

db = client.student_management

# Core Collections
users_collection = db.users
courses_collection = db.courses
attendance_collection = db.attendance
marks_collection = db.marks
qr_collection = db.qr_codes
notices_collection = db.notices

# Enterprise ERP Collections
library_books_collection = db.library_books
library_issues_collection = db.library_issues
events_collection = db.events
event_registrations_collection = db.event_registrations
audit_logs_collection = db.audit_logs
course_proposals_collection = db.course_proposals
notifications_collection = db.notifications

async def log_audit_event(
    user_id: str,
    user_email: str,
    action: str,
    resource_type: str,
    resource_id: str = None,
    details: dict = None
):
    """
    Enterprise Audit Logger for administrative & critical academic actions.
    """
    try:
        doc = {
            "user_id": str(user_id) if user_id else "system",
            "user_email": user_email or "system@campus.edu",
            "action": action,
            "resource_type": resource_type,
            "resource_id": str(resource_id) if resource_id else None,
            "details": details or {},
            "timestamp": datetime.utcnow()
        }
        await audit_logs_collection.insert_one(doc)
    except Exception as e:
        print(f"Audit log warning: {e}")

async def init_db_indexes():
    """
    Setup unique and performance indexes on startup.
    """
    try:
        # Unique email and sparse enrollment number
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("enrollment_no", unique=True, sparse=True)

        # Library ISBN unique index
        await library_books_collection.create_index("isbn", unique=True, sparse=True)

        # Event unique registration constraint
        await event_registrations_collection.create_index(
            [("event_id", 1), ("student_id", 1)],
            unique=True
        )

        # Course Code unique index
        await courses_collection.create_index("course_code", unique=True, sparse=True)
    except Exception as e:
        print(f"Index creation notice: {e}")