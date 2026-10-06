from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.MONGO_URL)

db = client.student_management

# Collections
users_collection = db.users
courses_collection = db.courses
attendance_collection = db.attendance
marks_collection = db.marks

qr_collection = db.qr_codes