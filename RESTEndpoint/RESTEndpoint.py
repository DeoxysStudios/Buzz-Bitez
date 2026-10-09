import uuid
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Response
from pwdlib import PasswordHash
from pydantic import AwareDatetime, BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session

import crud
from db import get_db

app = FastAPI()
password_hash = PasswordHash.recommended()

# Every endpoint that declares `db: DB` gets its own database session,
# which get_db closes when the request finishes (even if it errors).
DB = Annotated[Session, Depends(get_db)]


class ErrorOut(BaseModel):
    detail: str


# Extra status codes for the docs page. FastAPI only lists 200/201 and 422 on
# its own; these make the 404/409 cases visible to whoever reads /docs.
NOT_FOUND = {404: {"model": ErrorOut, "description": "Not found"}}
CONFLICT = {409: {"model": ErrorOut, "description": "Conflict"}}


# ---------- request and response models ----------
# Max lengths match the column sizes in models.py, so oversized input gets a
# 422 from validation instead of a database error.

class UserIn(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)

    model_config = {"json_schema_extra": {"examples": [
        {"username": "test_user", "email": "test_user@rpi.edu", "password": "password123"}
    ]}}


class UserOut(BaseModel):
    # No password field: response_model=UserOut strips anything not listed here.
    username: str
    email: str
    banned_until: str | None = None


TimeWindow = tuple[AwareDatetime, AwareDatetime]  # [start, end], timezone required


class EventUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    location: str = Field(min_length=1, max_length=200)
    times: list[TimeWindow] = Field(min_length=1)
    description: str | None = None
    tags: list[str] = []

    model_config = {"json_schema_extra": {"examples": [{
        "name": "APO pizza night (moved)",
        "location": "DCC 308",
        "times": [["2026-10-10T12:00:00-04:00", "2026-10-10T14:00:00-04:00"]],
        "description": "Moved upstairs.",
        "tags": ["pizza"],
    }]}}

    @field_validator("times")
    @classmethod
    def end_after_start(cls, times: list[TimeWindow]) -> list[TimeWindow]:
        for start, end in times:
            if end <= start:
                raise ValueError("each time window must end after it starts")
        return times

    @field_validator("tags")
    @classmethod
    def tag_length(cls, tags: list[str]) -> list[str]:
        if any(not 1 <= len(t) <= 50 for t in tags):
            raise ValueError("tags must be 1-50 characters")
        return tags


class EventIn(EventUpdate):
    # TODO: once login exists, take reporter from the logged-in user instead
    # of the request body, so nobody can post as someone else.
    reporter: str = Field(min_length=1, max_length=50)

    model_config = {"json_schema_extra": {"examples": [{
        "name": "APO pizza night",
        "reporter": "test_user",
        "location": "Student Union",
        "times": [["2026-10-10T12:00:00-04:00", "2026-10-10T14:00:00-04:00"]],
        "description": "Free pizza in the lobby.",
        "tags": ["pizza", "vegetarian"],
    }]}}


class EventOut(BaseModel):
    event_id: str
    name: str
    reporter: str
    location: str
    times: list[tuple[str, str]]
    description: str | None
    tags: list[str]
    likes: list[str]

    model_config = {"json_schema_extra": {"examples": [{
        "event_id": "0bdda61a-edd9-49de-a4a4-96aaa5b31f09",
        "name": "APO pizza night",
        "reporter": "test_user",
        "location": "Student Union",
        "times": [["2026-10-10T12:00:00-04:00", "2026-10-10T14:00:00-04:00"]],
        "description": "Free pizza in the lobby.",
        "tags": ["pizza", "vegetarian"],
        "likes": [],
    }]}}


class LikeIn(BaseModel):
    # TODO: same as reporter, should come from the logged-in user.
    username: str

    model_config = {"json_schema_extra": {"examples": [{"username": "test_user"}]}}


# ---------- users ----------

@app.get("/users", response_model=list[UserOut])
def list_users(db: DB):
    return crud.list_users(db)


@app.get("/users/{username}", response_model=UserOut, responses=NOT_FOUND)
def get_user(username: str, db: DB):
    user = crud.get_user(db, username)
    if user is None:
        raise HTTPException(404, f"No user with username {username} found.")
    return user


@app.post("/users", response_model=UserOut, status_code=201, responses=CONFLICT)
def create_user(user: UserIn, db: DB):
    try:
        return crud.create_user(db, user.username, user.email, password_hash.hash(user.password))
    except crud.UsernameTaken:
        raise HTTPException(409, f"Username {user.username} already exists.")
    except crud.EmailTaken:
        raise HTTPException(409, f"Email {user.email} is already registered.")


@app.delete("/users/{username}", status_code=204, responses=NOT_FOUND | CONFLICT)
def delete_user(username: str, db: DB):
    try:
        deleted = crud.delete_user(db, username)
    except crud.UserHasEvents:
        raise HTTPException(409, f"User {username} has reported events; delete those first.")
    if not deleted:
        raise HTTPException(404, f"No user with username {username} found.")
    return Response(status_code=204)


# ---------- events ----------

@app.get("/events", response_model=list[EventOut])
def list_events(db: DB):
    return crud.list_events(db)


@app.get("/events/{event_id}", response_model=EventOut, responses=NOT_FOUND)
def get_event(event_id: uuid.UUID, db: DB):
    event = crud.get_event(db, event_id)
    if event is None:
        raise HTTPException(404, f"No event with event_id {event_id} found.")
    return event


@app.post("/events", response_model=EventOut, status_code=201)
def create_event(event: EventIn, db: DB):
    # mode="json" turns the datetimes back into ISO strings with their offsets,
    # which is the format crud expects.
    data = event.model_dump(mode="json")
    try:
        return crud.create_event(db, data, reporter=event.reporter)
    except crud.UserNotFound:
        raise HTTPException(422, f"Reporter {event.reporter} is not a registered user.")


@app.put("/events/{event_id}", response_model=EventOut, responses=NOT_FOUND)
def update_event(event_id: uuid.UUID, event: EventUpdate, db: DB):
    updated = crud.update_event(db, event_id, event.model_dump(mode="json"))
    if updated is None:
        raise HTTPException(404, f"No event with event_id {event_id} found.")
    return updated


@app.delete("/events/{event_id}", status_code=204, responses=NOT_FOUND)
def delete_event(event_id: uuid.UUID, db: DB):
    if not crud.delete_event(db, event_id):
        raise HTTPException(404, f"No event with event_id {event_id} found.")
    return Response(status_code=204)


# ---------- likes ----------
# Liking is idempotent: liking twice or un-liking something you never liked
# is not an error, so a double-click never shows the user a failure.

@app.post("/events/{event_id}/likes", status_code=204, responses=NOT_FOUND)
def add_like(event_id: uuid.UUID, like: LikeIn, db: DB):
    try:
        crud.add_like(db, event_id, like.username)
    except crud.EventNotFound:
        raise HTTPException(404, f"No event with event_id {event_id} found.")
    except crud.UserNotFound:
        raise HTTPException(422, f"User {like.username} is not a registered user.")
    return Response(status_code=204)


@app.delete("/events/{event_id}/likes/{username}", status_code=204)
def remove_like(event_id: uuid.UUID, username: str, db: DB):
    crud.remove_like(db, event_id, username)
    return Response(status_code=204)
