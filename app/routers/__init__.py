
from fastapi import APIRouter

from app.routers.api import router as api_auth_router
from app.routers.admin import router as admin_router
from app.routers.teacher import router as teacher_router
from app.routers.student import router as student_router
from app.routers.notices import router as notices_router
from app.routers.library import router as library_router
from app.routers.events import router as events_router
from app.routers.notifications import router as notifications_router

router = APIRouter()

# Authentication
router.include_router(api_auth_router)

# Admin
router.include_router(admin_router)

# Teacher
router.include_router(teacher_router)

# Student
router.include_router(student_router)

# Notices & Announcements
router.include_router(notices_router)

# Library Management
router.include_router(library_router)

# Events & Activities
router.include_router(events_router)

# Unified Notifications
router.include_router(notifications_router)