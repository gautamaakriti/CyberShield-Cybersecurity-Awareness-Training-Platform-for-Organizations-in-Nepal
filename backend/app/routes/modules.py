from fastapi import APIRouter, Depends, HTTPException, Form, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.training_module import TrainingModule
from app.models.quiz import Quiz, QuizQuestion

router = APIRouter()


def module_to_dict(m):
    quiz_data = None
    if m.quiz:
        quiz_data = {
            "id": m.quiz.id,
            "title": m.quiz.title,
            "question_count": len(m.quiz.questions),
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
                for q in m.quiz.questions
            ]
        }
    return {
        "id": m.id,
        "title": m.title,
        "description": m.description,
        "video_url": m.video_url or "",
        "video_duration_seconds": m.video_duration_seconds or 0,
        "pass_threshold": m.pass_threshold,
        "is_active": m.is_active,
        "created_at": str(m.created_at),
        "content_type": m.content_type or "video",
        "category": m.category or "mandatory",
        "summary": m.summary or "",
        "quiz": quiz_data
    }


@router.get("")
def list_modules(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    modules = db.query(TrainingModule).filter(
        TrainingModule.is_active == True
    ).order_by(TrainingModule.id).all()
    return [module_to_dict(m) for m in modules]


@router.get("/{module_id}")
def get_module(
    module_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    m = db.query(TrainingModule).filter(
        TrainingModule.id == module_id
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    return module_to_dict(m)


@router.post("")
async def create_module(
    request: Request,
    title: str = Form(...),
    description: str = Form(""),
    pass_threshold: int = Form(80),
    video_url: str = Form(""),
    content_type: str = Form("video"),
    category: str = Form("mandatory"),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    allowed_content_types = {"video", "pdf"}
    allowed_categories = {"mandatory", "nepal_compliance", "optional"}

    content_type = (content_type or "video").strip().lower()
    category = (category or "mandatory").strip().lower()

    if content_type not in allowed_content_types:
        content_type = "video"

    if category not in allowed_categories:
        category = "mandatory"

    module = TrainingModule(
        title=title,
        description=description,
        pass_threshold=pass_threshold,
        video_url=video_url,
        content_type=content_type,
        category=category,
        is_active=True,
        created_by=admin.id
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return module_to_dict(module)


@router.put("/{module_id}")
def update_module(
    module_id: int,
    title: str = Form(...),
    description: str = Form(""),
    pass_threshold: int = Form(80),
    video_url: str = Form(""),
    content_type: str = Form("video"),
    category: str = Form("mandatory"),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    module = db.query(TrainingModule).filter(
        TrainingModule.id == module_id,
        TrainingModule.is_active == True
    ).first()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    allowed_content_types = {"video", "pdf"}
    allowed_categories = {"mandatory", "nepal_compliance", "optional"}

    content_type = (content_type or "video").strip().lower()
    category = (category or "mandatory").strip().lower()

    if content_type not in allowed_content_types:
        content_type = "video"

    if category not in allowed_categories:
        category = "mandatory"

    module.title = title
    module.description = description
    module.pass_threshold = pass_threshold
    module.video_url = video_url
    module.content_type = content_type
    module.category = category

    db.commit()
    db.refresh(module)
    return module_to_dict(module)


@router.delete("/{module_id}")
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    m = db.query(TrainingModule).filter(
        TrainingModule.id == module_id
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Module not found")
    m.is_active = False
    db.commit()
    return {"message": "Module deleted"}


@router.post("/{module_id}/quiz")
def create_or_update_quiz(
    module_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    existing = db.query(Quiz).filter(
        Quiz.module_id == module_id
    ).first()
    if existing:
        db.query(QuizQuestion).filter(
            QuizQuestion.quiz_id == existing.id
        ).delete()
        existing.title = data.get("title", "Quiz")
        quiz = existing
    else:
        quiz = Quiz(module_id=module_id, title=data.get("title", "Quiz"))
        db.add(quiz)
        db.flush()

    for i, q in enumerate(data.get("questions", [])):
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q["question_text"],
            option_a=q["option_a"],
            option_b=q["option_b"],
            option_c=q["option_c"],
            option_d=q["option_d"],
            correct_option=q["correct_option"],
            order_index=i
        )
        db.add(question)
    db.commit()
    db.refresh(quiz)
    return {
        "id": quiz.id,
        "title": quiz.title,
        "module_id": quiz.module_id
    }


@router.get("/{module_id}/quiz")
def get_quiz(
    module_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    quiz = db.query(Quiz).filter(Quiz.module_id == module_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="No quiz found")
    return {
        "id": quiz.id,
        "title": quiz.title,
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
            for q in quiz.questions
        ]
    }