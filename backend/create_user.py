import asyncio
import sys
from database import create_user, get_user_by_email
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def main():
    if len(sys.argv) < 4:
        print("Usage: python create_user.py <email> <password> <full_name>")
        sys.exit(1)
        
    email = sys.argv[1].lower().strip()
    password = sys.argv[2]
    full_name = sys.argv[3]
    
    # Check if user already exists
    existing = await get_user_by_email(email)
    if existing:
        print(f"User {email} already exists in the database.")
        return
        
    hashed = get_password_hash(password)
    user_dict = {
        "email": email,
        "hashed_password": hashed,
        "full_name": full_name,
        "notifications_enabled": True
    }
    
    new_user = await create_user(user_dict)
    print(f"Successfully created user {email} (ID: {new_user['_id']})")

if __name__ == "__main__":
    asyncio.run(main())
