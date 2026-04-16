from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_admin
from app.models.admin import Admin
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == data.email).first()
    if not admin or not verify_password(data.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(admin.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {"id": admin.id, "email": admin.email, "full_name": admin.full_name}
    }

@router.get("/me")
def me(admin=Depends(get_current_admin)):
    return {"id": admin.id, "email": admin.email, "full_name": admin.full_name}
