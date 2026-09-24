from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.user import User, UserRole


db = SessionLocal()

email = "staff@college.com"

existing = db.scalar(
    select(User).where(User.email == email)
)

if not existing:
    staff = User(
        full_name="Support Staff",
        email=email,
        password_hash=hash_password("staff123"),
        role=UserRole.STAFF,
    )

    db.add(staff)
    db.commit()

    print("Staff created")
else:
    print("Staff already exists")

db.close()