from datetime import datetime, timedelta, timezone
from typing import List
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import users_collection

# -----------------------------
# Password Hashing
# -----------------------------

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/token"
)


# -----------------------------
# Password Functions
# -----------------------------

def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str):
    return pwd_context.verify(password, hashed)


# -----------------------------
# JWT Token
# -----------------------------

def create_access_token(data: dict):
    

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update(
        {
            "exp": expire
        }
    )

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

# -----------------------------
# Refresh Token
# -----------------------------

def create_refresh_token(data: dict):

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        days=7
    )

    to_encode.update(
        {
            "exp": expire
        }
    )

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


# -----------------------------
# Current User
# -----------------------------

async def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )

    try:

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = await users_collection.find_one(
        {
            "_id": ObjectId(user_id)
        }
    )

    if user is None:
        raise credentials_exception

    user["_id"] = str(user["_id"])

    return user


# -----------------------------
# Role Checker
# -----------------------------

class RoleChecker:

    def __init__(self, roles: List[str]):
        self.roles = roles

    async def __call__(
        self,
        current_user: dict = Depends(get_current_user)
    ):

        user_roles = current_user.get("role", [])

        # Backward compatibility
        if isinstance(user_roles, str):
            user_roles = [user_roles]

        if not any(role in user_roles for role in self.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied"
            )

        return current_user