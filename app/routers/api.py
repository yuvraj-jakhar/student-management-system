from fastapi import APIRouter, Depends, HTTPException, status

from fastapi.security import OAuth2PasswordRequestForm

from fastapi import UploadFile, File
from app.schemas.user import LoginRequest

from jose import jwt, JWTError
from app.config import settings

from app.auth import (
    RoleChecker,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_password
)
import shutil
import os
import uuid

from app.core.logger import logger

from app.database import users_collection

from app.auth import (
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_password
)

from app.schemas.user import (
    UserRegister,
    ForgotPassword,
    ResetPassword
)

router = APIRouter(tags=["Authentication"])


# =====================================
# Login
# =====================================

@router.post("/login")
async def login(data: LoginRequest):

    user = await users_collection.find_one(
        {
            "email": data.email
        }
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    if not verify_password(
        data.password,
        user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    payload = {
        "sub": str(user["_id"]),
        "email": user["email"],
        "role": user["role"]
    }

    access_token = create_access_token(payload)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# =====================================
# Swagger OAuth2 Login
# =====================================

@router.post("/token")
async def token_login(
    form_data: OAuth2PasswordRequestForm = Depends()
):

    user = await users_collection.find_one(
        {
            "email": form_data.username
        }
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    if not verify_password(
        form_data.password,
        user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    access_token = create_access_token(
        {
            "sub": str(user["_id"]),
            "email": user["email"],
            "role": user["role"]
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
    
    
# =====================================
# Register
# =====================================

@router.post("/register")
async def register(
    user: UserRegister,
    current_user: dict = Depends(
        RoleChecker(["admin", "can_create_student"])
    )
):

    # Check Email
    existing = await users_collection.find_one(
        {"email": user.email}
    )

    if existing:
        logger.warning(f"Register Failed : {user.email} already exists")
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    data = user.model_dump()

    # Hash Password
    data["password"] = hash_password(data["password"])

    result = await users_collection.insert_one(data)

    logger.info(f"New User Registered : {user.email}")

    return {
        "message": "User Registered Successfully",
        "id": str(result.inserted_id)
    }


# =====================================
# Upload Profile Image
# =====================================

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...)
):

    allowed = [".jpg", ".jpeg", ".png"]

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in allowed:
        logger.warning(f"Invalid File Upload : {file.filename}")
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG and PNG files are allowed"
        )

    filename = f"{uuid.uuid4()}{extension}"

    filepath = os.path.join(
        "uploads",
        filename
    )

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    logger.info(f"Image Uploaded : {filename}")

    return {
        "message": "Image uploaded successfully",
        "image_url": f"/uploads/{filename}"
    }
    
# =====================================
# Forgot Password
# =====================================

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPassword
):

    user = await users_collection.find_one(
        {
            "email": data.email
        }
    )

    if not user:
        logger.warning(f"Forgot Password : {data.email} not found")

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    logger.info(f"Forgot Password Request : {data.email}")

    return {
        "message": "User Found. Continue to Reset Password."
    }
    
# =====================================
# Reset Password
# =====================================

@router.put("/reset-password")
async def reset_password(
    data: ResetPassword
):

    user = await users_collection.find_one(
        {
            "email": data.email
        }
    )

    if not user:

        logger.warning(f"Reset Password : {data.email} not found")

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    new_password = hash_password(data.new_password)

    await users_collection.update_one(
        {
            "email": data.email
        },
        {
            "$set": {
                "password": new_password
            }
        }
    )

    logger.info(f"Password Reset : {data.email}")

    return {
        "message": "Password updated successfully"
    }
    
# =====================================
# Refresh Token
# =====================================

@router.post("/refresh-token")
async def refresh_token_api(refresh_token: str):

    try:
        payload = jwt.decode(
            refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        access_token = create_access_token(
            {
                "sub": payload["sub"],
                "username": payload["username"],
                "name": payload["name"],
                "role": payload["role"]
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Refresh Token"
        )