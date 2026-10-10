from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from schemas import UserOut
from models import User

router = APIRouter()


@router.get("/auth/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the current (mock) user. No auth required."""
    return current_user
