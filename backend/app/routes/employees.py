import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_admin, hash_password, verify_password, create_access_token
from app.models.employee import Employee, TrainingLink
from app.models.training_module import TrainingModule
from app.models.progress import TrainingProgress, QuizAttempt
from pydantic import BaseModel

router = APIRouter()


class EmployeeCreate(BaseModel):
    full_name: str
    email: str
    password: str = "Nepal@123"
    department: str = ""
    organization: str = ""


class BulkAssignRequest(BaseModel):
    employee_ids: List[int]
    module_ids: List[int]


class EmployeeLoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def employee_login(data: EmployeeLoginRequest, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.email == data.email).first()
    if not employee:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not employee.hashed_password:
        raise HTTPException(status_code=401, detail="Password not set. Contact your administrator.")
    if not verify_password(data.password, employee.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(employee.id), "role": "employee"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "employee": {
            "id": employee.id,
            "full_name": employee.full_name,
            "email": employee.email,
            "department": employee.department,
            "organization": employee.organization,
        },
    }


@router.get("/my-modules")
def get_my_modules(token: str, db: Session = Depends(get_db)):
    from app.core.config import settings
    from jose import jwt, JWTError

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        employee_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")

    links = db.query(TrainingLink).filter(TrainingLink.employee_id == employee_id).all()

    result = []
    for link in links:
        module = link.module
        if not module or not module.is_active:
            continue
        progress = db.query(TrainingProgress).filter(
            TrainingProgress.employee_id == employee_id,
            TrainingProgress.module_id == module.id,
        ).first()

        quiz_info = None
        if module.quiz:
            quiz_info = {
                "id": module.quiz.id,
                "title": module.quiz.title,
                "question_count": len(module.quiz.questions),
            }

        result.append({
            "link_token": link.token,
            "module": {
                "id": module.id,
                "title": module.title,
                "description": module.description,
                "video_url": module.video_url,
                "pass_threshold": module.pass_threshold,
                "content_type": module.content_type or "video",
                "category": module.category or "mandatory",
                "quiz": quiz_info,
            },
            "progress": {
                "status": progress.status if progress else "not_started",
                "attempts": progress.attempts if progress else 0,
                "best_score": progress.best_score if progress else 0,
                "completed_at": str(progress.completed_at) if progress and progress.completed_at else None,
            },
        })
    return result


@router.get("")
def list_employees(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    employees = db.query(Employee).all()
    result = []
    for e in employees:
        assigned = db.query(TrainingLink).filter(TrainingLink.employee_id == e.id).count()
        completed = db.query(TrainingProgress).filter(
            TrainingProgress.employee_id == e.id,
            TrainingProgress.status == "passed",
        ).count()
        result.append({
            "id": e.id,
            "full_name": e.full_name,
            "email": e.email,
            "department": e.department,
            "organization": e.organization,
            "is_active": e.is_active,
            "created_at": str(e.created_at),
            "assigned_modules": assigned,
            "completed_modules": completed,
        })
    return result


@router.post("")
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    existing = db.query(Employee).filter(Employee.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An employee with this email already exists")

    employee = Employee(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        department=data.department,
        organization=data.organization,
        created_by=admin.id,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    return {
        "id": employee.id,
        "full_name": employee.full_name,
        "email": employee.email,
        "department": employee.department,
        "organization": employee.organization,
        "is_active": employee.is_active,
        "created_at": str(employee.created_at),
        "assigned_modules": 0,
        "completed_modules": 0,
    }


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # FIX: Also delete phishing assignments — previously missing, caused FK constraint errors
    from app.models.phishing import PhishingAssignment
    db.query(PhishingAssignment).filter(PhishingAssignment.employee_id == employee_id).delete()

    db.query(TrainingProgress).filter(TrainingProgress.employee_id == employee_id).delete()
    db.query(TrainingLink).filter(TrainingLink.employee_id == employee_id).delete()
    db.query(QuizAttempt).filter(QuizAttempt.employee_id == employee_id).delete()

    db.delete(emp)
    db.commit()
    return {"message": "Deleted successfully"}


@router.post("/assign-modules")
def assign_modules(
    data: BulkAssignRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    results = []
    for employee_id in data.employee_ids:
        for module_id in data.module_ids:
            existing = db.query(TrainingLink).filter(
                TrainingLink.employee_id == employee_id,
                TrainingLink.module_id == module_id,
            ).first()
            if existing:
                results.append({
                    "employee_id": employee_id,
                    "module_id": module_id,
                    "token": existing.token,
                    "already_existed": True,
                })
            else:
                token = uuid.uuid4().hex
                link = TrainingLink(
                    token=token,
                    employee_id=employee_id,
                    module_id=module_id,
                    created_by=admin.id,
                )
                db.add(link)
                db.commit()
                db.refresh(link)
                results.append({
                    "employee_id": employee_id,
                    "module_id": module_id,
                    "token": link.token,
                    "already_existed": False,
                })
    return {"assignments": results, "total": len(results)}


# Keep old endpoint for backwards compatibility
@router.post("/generate-links")
def generate_links_compat(
    data: BulkAssignRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return assign_modules(data, db, admin)