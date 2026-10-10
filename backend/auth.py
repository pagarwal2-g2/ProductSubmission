"""
Auth module — no authentication in dev mode.

get_current_user returns a synthetic admin User object so all route
dependencies continue to work without any changes to the routers.
require_admin is an alias — everyone is admin while auth is disabled.
"""
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
import uuid

# Stable synthetic ID so FK references are consistent within a session
_MOCK_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Return a synthetic admin user — no token required."""
    # Try to find/create the mock user in DB so reviewer_id FK works
    user = db.query(User).filter(User.id == _MOCK_USER_ID).first()
    if not user:
        user = User(
            id=_MOCK_USER_ID,
            google_id=None,
            email="admin@local.dev",
            name="Admin",
            picture=None,
            role="admin",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Everyone is admin while auth is disabled."""
    return current_user
