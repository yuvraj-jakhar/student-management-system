import asyncio

from app.database import users_collection
from app.auth import hash_password


async def seed_admin():

    admin = await users_collection.find_one(
        {"email": "admin@gmail.com"}
    )

    if admin:
        print("✅ Admin already exists")
        return

    await users_collection.insert_one(
        {
            "first_name": "Administrator",
            "last_name": "",
            "email": "admin@gmail.com",
            "password": hash_password("123456"),
            "role": "admin",
            "phone_no": None,
            "image": None
        }
    )

    print("✅ Admin Created Successfully")
    print("Email    : admin@gmail.com")
    print("Password : 123456")


if __name__ == "__main__":
    asyncio.run(seed_admin())