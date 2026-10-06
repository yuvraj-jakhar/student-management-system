from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import router as api_router
from app.core.exceptions import register_exception_handlers


# ==========================================
# FastAPI App
# ==========================================

app = FastAPI(
    title="Student Management System API",
    description="Flow Driven Multi Role Student Management System",
    version="1.0.0"
)


# ==========================================
# Exception Handlers
# ==========================================

register_exception_handlers(app)


# ==========================================
# CORS Middleware
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Development ke liye
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Routers
# ==========================================

app.include_router(api_router)


# ==========================================
# Static Files
# ==========================================

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


# ==========================================
# Home API
# ==========================================

@app.get("/")
async def home():
    return {
        "message": "Student Management System API"
    }


# ==========================================
# Health Check
# ==========================================

@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }