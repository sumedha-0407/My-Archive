from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

from .database import Base, engine, get_db
from .models import User, Note
from .auth import verify_password


# --------------------------------------------------
# APP SETUP
# --------------------------------------------------

app = FastAPI(title="MyArchive")

# IMPORTANT:
# Change this before putting the website online.
SESSION_SECRET = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET"

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    max_age=60 * 60 * 24 * 7,
    same_site="lax",
    https_only=False
)


# Create database tables
Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# FRONTEND
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)


@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


class NoteCreate(BaseModel):
    title: str
    content: str


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


# --------------------------------------------------
# AUTH HELPERS
# --------------------------------------------------

def get_current_user(
    request: Request,
    db: Session
):
    user_id = request.session.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Not logged in"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        request.session.clear()

        raise HTTPException(
            status_code=401,
            detail="Invalid session"
        )

    return user


# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@app.post("/api/login")
def login(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.username == data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    if not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    request.session["user_id"] = user.id

    return {
        "message": "Login successful",
        "username": user.username
    }


# --------------------------------------------------
# LOGOUT
# --------------------------------------------------

@app.post("/api/logout")
def logout(request: Request):
    request.session.clear()

    return {
        "message": "Logged out"
    }


# --------------------------------------------------
# CHECK LOGIN
# --------------------------------------------------

@app.get("/api/me")
def me(
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)

    return {
        "username": user.username
    }


# --------------------------------------------------
# GET NOTES
# --------------------------------------------------

@app.get("/api/notes")
def get_notes(
    request: Request,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)

    query = db.query(Note).filter(
        Note.user_id == user.id
    )

    if search:
        search_text = f"%{search}%"

        query = query.filter(
            (Note.title.ilike(search_text))
            |
            (Note.content.ilike(search_text))
        )

    notes = query.order_by(
        Note.updated_at.desc()
    ).all()

    return [
        {
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "is_favorite": note.is_favorite,
            "created_at": note.created_at.isoformat(),
            "updated_at": note.updated_at.isoformat()
        }
        for note in notes
    ]


# --------------------------------------------------
# GET ONE NOTE
# --------------------------------------------------

@app.get("/api/notes/{note_id}")
def get_note(
    note_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)

    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user.id
    ).first()

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "is_favorite": note.is_favorite,
        "created_at": note.created_at.isoformat(),
        "updated_at": note.updated_at.isoformat()
    }


# --------------------------------------------------
# CREATE NOTE
# --------------------------------------------------

@app.post("/api/notes")
def create_note(
    data: NoteCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)

    if not data.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Note name is required"
        )

    note = Note(
        user_id=user.id,
        title=data.title.strip(),
        content=data.content
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "message": "Note saved",
        "id": note.id
    }


# --------------------------------------------------
# UPDATE NOTE
# --------------------------------------------------

@app.put("/api/notes/{note_id}")
def update_note(
    note_id: int,
    data: NoteUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)

    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user.id
    ).first()

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    if data.title is not None:
        if not data.title.strip():
            raise HTTPException(
                status_code=400,
                detail="Note name cannot be empty"
            )

        note.title = data.title.strip()

    if data.content is not None:
        note.content = data.content

    db.commit()
    db.refresh(note)

    return {
        "message": "Note updated"
    }


# --------------------------------------------------
# DELETE NOTE
# --------------------------------------------------

@app.delete("/api/notes/{note_id}")
def delete_note(
    note_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)

    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user.id
    ).first()

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    db.delete(note)
    db.commit()

    return {
        "message": "Note deleted"
    }