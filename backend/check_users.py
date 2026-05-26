import asyncio
import os
from database import users_collection

async def check_users():
    try:
        users = await users_collection.find().to_list(length=10)
        if not users:
            print("No users found.")
        for user in users:
            print(f"Email: {user.get('email')}")
    except Exception as e:
        print(f"Error checking users: {e}")

if __name__ == "__main__":
    asyncio.run(check_users())
