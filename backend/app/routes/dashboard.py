from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.employee import Employee, TrainingLink
from app.models.training_module import TrainingModule
from app.models.progress import TrainingProgress, QuizAttempt

router = APIRouter()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    total_employees = db.query(Employee).count()
    total_modules = db.query(TrainingModule).filter(
        TrainingModule.is_active == True
    ).count()
    total_assignments = db.query(TrainingLink).count()
    passed = db.query(TrainingProgress).filter(
        TrainingProgress.status == "passed"
    ).count()
    failed = db.query(TrainingProgress).filter(
        TrainingProgress.status == "failed"
    ).count()
    in_progress = db.query(TrainingProgress).filter(
        TrainingProgress.status.in_(["watching", "quiz_pending"])
    ).count()
    completion_rate = round(
        (passed / total_assignments * 100)
    ) if total_assignments > 0 else 0

    recent = db.query(TrainingProgress).order_by(
        TrainingProgress.id.desc()
    ).limit(8).all()

    recent_data = []
    for p in recent:
        recent_data.append({
            "id": p.id,
            "status": p.status,
            "best_score": p.best_score,
            "attempts": p.attempts,
            "completed_at": str(p.completed_at) if p.completed_at else None,
            "employee": {
                "full_name": p.employee.full_name,
                "email": p.employee.email
            } if p.employee else None,
            "module": {
                "title": p.module.title
            } if p.module else None,
        })

    return {
        "total_employees": total_employees,
        "total_modules": total_modules,
        "total_assignments": total_assignments,
        "completion_rate": completion_rate,
        "total_completions": passed,
        "failed_attempts": failed,
        "in_progress": in_progress,
        "recent_completions": recent_data
    }


@router.get("/progress")
def get_progress(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    records = db.query(TrainingProgress).order_by(
        TrainingProgress.id.desc()
    ).all()
    return [
        {
            "id": p.id,
            "status": p.status,
            "attempts": p.attempts,
            "best_score": p.best_score,
            "completed_at": str(p.completed_at) if p.completed_at else None,
            "employee": {
                "full_name": p.employee.full_name,
                "email": p.employee.email
            } if p.employee else None,
            "module": {
                "title": p.module.title,
                "category": p.module.category
            } if p.module else None,
        }
        for p in records
    ]


@router.delete("/progress/{progress_id}")
def delete_progress_record(
    progress_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    record = db.query(TrainingProgress).filter(
        TrainingProgress.id == progress_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Training record not found")

    db.query(QuizAttempt).filter(
        QuizAttempt.progress_id == progress_id
    ).delete()

    db.delete(record)
    db.commit()

    return {"message": "Training record deleted successfully"}


@router.delete("/progress")
def reset_all_progress(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    db.query(QuizAttempt).delete()
    db.query(TrainingProgress).delete()
    db.commit()

    return {"message": "All training records reset successfully"}