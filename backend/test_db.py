import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def test_connection():
    load_dotenv()
    mongodb_url = os.getenv("MONGODB_URL")
    print(f"Testing connection to: {mongodb_url}")
    
    try:
        client = AsyncIOMotorClient(mongodb_url)
        # The ping command is cheap and does not require auth
        await client.admin.command('ping')
        print("Database connection successful!")
        
        db = client.nutri_insight_grid
        users = db.users
        
        # Test write
        test_user = {"email": "test_sync@example.com", "full_name": "Sync Test User"}
        result = await users.update_one(
            {"email": "test_sync@example.com"},
            {"$set": test_user},
            upsert=True
        )
        print(f"Test write successful: {result.upserted_id or 'updated'}")
        
        # Test read
        user = await users.find_one({"email": "test_sync@example.com"})
        print(f"Test read successful: {user['full_name']}")
        
    except Exception as e:
        print(f"Database connection failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
