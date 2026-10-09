from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import router as api_router
from app.core.exceptions import register_exception_handlers
from app.database import init_db_indexes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_indexes()
    yield


# ==========================================
# FastAPI App
# ==========================================

app = FastAPI(
    title="Rajasthan Institute of Engineering & Technology, Jaipur - ERP API",
    description="Enterprise College ERP for Rajasthan Institute of Engineering & Technology (RIET), Jaipur",
    version="2.0.0",
    lifespan=lifespan
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
        "message": "Rajasthan Institute of Engineering & Technology (RIET Jaipur) ERP API"
    }


# ==========================================
# Health Check
# ==========================================

@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }