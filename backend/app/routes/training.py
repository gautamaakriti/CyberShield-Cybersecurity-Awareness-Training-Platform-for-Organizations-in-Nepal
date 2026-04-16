from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.employee import TrainingLink
from app.models.training_module import TrainingModule
from app.models.progress import TrainingProgress, QuizAttempt
from app.models.quiz import Quiz, QuizQuestion
from pydantic import BaseModel
from typing import Dict

router = APIRouter()


class SubmitQuizRequest(BaseModel):
    answers: Dict[str, str]


def get_or_create_progress(db, employee_id, module_id):
    progress = db.query(TrainingProgress).filter(
        TrainingProgress.employee_id == employee_id,
        TrainingProgress.module_id == module_id
    ).first()
    if not progress:
        progress = TrainingProgress(
            employee_id=employee_id,
            module_id=module_id,
            status="not_started"
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    return progress


def build_module_dict(module):
    """Build full module dict including video_url, quiz, summary."""
    quiz_data = None
    if module.quiz:
        quiz_data = {
            "id": module.quiz.id,
            "title": module.quiz.title,
            "questions": [
                {
                    "id": q.id,
                    "question_text": q.question_text,
                    "option_a": q.option_a,
                    "option_b": q.option_b,
                    "option_c": q.option_c,
                    "option_d": q.option_d,
                    "correct_option": q.correct_option,
                    "order_index": q.order_index
                }
                for q in module.quiz.questions
            ]
        }
    return {
        "id": module.id,
        "title": module.title,
        "description": module.description,
        "video_url": module.video_url or "",
        "pass_threshold": module.pass_threshold,
        "content_type": module.content_type or "video",
        "category": module.category or "mandatory",
        "summary": module.summary or "",
        "quiz": quiz_data
    }


@router.get("/{token}")
def validate_token(token: str, db: Session = Depends(get_db)):
    link = db.query(TrainingLink).filter(
        TrainingLink.token == token
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invalid training link")

    employee = link.employee
    module = link.module

    if not employee or not module:
        raise HTTPException(status_code=404, detail="Invalid training link")

    progress = get_or_create_progress(db, employee.id, module.id)

    return {
        "employee": {
            "id": employee.id,
            "full_name": employee.full_name,
            "email": employee.email
        },
        "module": build_module_dict(module),
        "progress": {
            "status": progress.status,
            "attempts": progress.attempts,
            "best_score": progress.best_score,
            "video_watched": progress.video_watched
        }
    }


@router.post("/{token}/start")
def start_training(token: str, db: Session = Depends(get_db)):
    link = db.query(TrainingLink).filter(
        TrainingLink.token == token
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invalid link")
    progress = get_or_create_progress(db, link.employee_id, link.module_id)
    if progress.status == "not_started":
        progress.status = "watching"
        db.commit()
    return {"status": progress.status}


@router.post("/{token}/video-complete")
def complete_video(token: str, db: Session = Depends(get_db)):
    link = db.query(TrainingLink).filter(
        TrainingLink.token == token
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invalid link")
    progress = get_or_create_progress(db, link.employee_id, link.module_id)
    progress.video_watched = True
    progress.status = "quiz_pending"
    db.commit()
    return {"status": progress.status}


@router.post("/{token}/submit-quiz")
def submit_quiz(
    token: str,
    data: SubmitQuizRequest,
    db: Session = Depends(get_db)
):
    link = db.query(TrainingLink).filter(
        TrainingLink.token == token
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invalid link")

    module = link.module
    quiz = module.quiz
    if not quiz:
        raise HTTPException(status_code=400, detail="No quiz for this module")

    questions = quiz.questions
    if not questions:
        raise HTTPException(status_code=400, detail="Quiz has no questions")

    correct = 0
    for q in questions:
        answer = data.answers.get(str(q.id))
        if answer and answer.upper() == q.correct_option.upper():
            correct += 1

    score = round((correct / len(questions)) * 100)
    passed = score >= module.pass_threshold

    progress = get_or_create_progress(db, link.employee_id, link.module_id)
    progress.attempts += 1
    progress.best_score = max(progress.best_score or 0, score)
    progress.status = "passed" if passed else "failed"
    if passed:
        progress.completed_at = datetime.utcnow()
        link.is_used = True

    attempt = QuizAttempt(
        employee_id=link.employee_id,
        quiz_id=quiz.id,
        progress_id=progress.id,
        score=score,
        passed=passed,
        answers=data.answers
    )
    db.add(attempt)
    db.commit()

    return {
        "score": score,
        "passed": passed,
        "correct": correct,
        "total": len(questions),
        "pass_threshold": module.pass_threshold
    }


@router.get("/{token}/result")
def get_result(token: str, db: Session = Depends(get_db)):
    link = db.query(TrainingLink).filter(
        TrainingLink.token == token
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invalid link")

    progress = get_or_create_progress(db, link.employee_id, link.module_id)

    return {
        "passed": progress.status == "passed",
        "score": progress.best_score or 0,
        "attempts": progress.attempts,
        "pass_threshold": link.module.pass_threshold,
        "employee_name": link.employee.full_name,
        "module_title": link.module.title
    }