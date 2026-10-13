import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from models import Event, EventTag, EventTime, Like, User


class UsernameTaken(Exception):
    pass


class EmailTaken(Exception):
    pass


class EventNotFound(Exception):
    pass


_WITH_CHILDREN = (
    selectinload(Event.times),
    selectinload(Event.tags),
    selectinload(Event.likes),
)


def _event_to_dict(event: Event) -> dict:
    return {
        "event_id": str(event.id),
        "name": event.name,
        "reporter": event.reporter,
        "location": event.location,
        "times": [[t.starts_at.isoformat(), t.ends_at.isoformat()] for t in event.times],
        "description": event.description,
        "tags": [t.tag for t in event.tags],
        "likes": [like.username for like in event.likes],
    }


# users

def create_user(db: Session, username: str, email: str, password_hash: str) -> dict:
    db.add(User(username=username, email=email, password_hash=password_hash))
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        constraint = e.orig.diag.constraint_name
        if constraint == "users_pkey":
            raise UsernameTaken(username) from e
        if constraint == "users_email_key":
            raise EmailTaken(email) from e
        raise
    return {"username": username, "email": email}

def get_user(db: Session, username: str) -> dict | None:
    # Return the user's public fields, or None if not found
    user = db.get(User, username)
    if user is None:
        return None
    return {
        "username": user.username,
        "email": user.email,
        "banned_until": user.banned_until.isoformat() if user.banned_until else None,
    }

# events

def list_events(db: Session) -> list[dict]:
    stmt = select(Event).options(*_WITH_CHILDREN).order_by(Event.created_at.desc())
    return [_event_to_dict(e) for e in db.scalars(stmt)]


def get_event(db: Session, event_id: uuid.UUID) -> dict | None:
    event = db.get(Event, event_id, options=_WITH_CHILDREN)
    return _event_to_dict(event) if event else None


def create_event(db: Session, data: dict, reporter: str) -> dict:
    event = Event(
        name=data["name"],
        reporter=reporter,
        location=data["location"],
        description=data.get("description"),
        times=[
            EventTime(starts_at=datetime.fromisoformat(s), ends_at=datetime.fromisoformat(e))
            for s, e in data["times"]
        ],
        tags=[EventTag(tag=t) for t in dict.fromkeys(data.get("tags", []))],
    )
    db.add(event)
    db.commit()
    return _event_to_dict(event)

def update_event(db: Session, event_id: uuid.UUID, data: dict) -> dict | None:
    # Replace the event's fields, times, and tags with what's in data. Return the updated dict, or None if not found
    event = db.get(Event, event_id, options=_WITH_CHILDREN)
    if event is None:
        return None

    event.name = data["name"]
    event.location = data["location"]
    event.description = data.get("description")

    event.times = [
            EventTime(starts_at=datetime.fromisoformat(s), ends_at=datetime.fromisoformat(e))
            for s, e in data["times"]
        ]
    event.tags = [EventTag(tag=t) for t in dict.fromkeys(data.get("tags", []))]

    db.commit()
    return _event_to_dict(event)


def delete_event(db: Session, event_id: uuid.UUID) -> bool:
    # True if deleted, False if no such event
    event = db.get(Event, event_id)
    if event is None:
        return False
    db.delete(event)
    db.commit()
    return True
    

# likes

def add_like(db: Session, event_id: uuid.UUID, username: str) -> bool:
    # True if the like was added, False if this user already liked the event
    db.add(Like(event_id=event_id, username=username))
    try:
        db.commit()
        return True
    except IntegrityError as e:
        db.rollback()
        if e.orig.diag.constraint_name == "likes_pkey":
            return False
        if e.orig.diag.constraint_name == "likes_event_id_fkey":
            raise EventNotFound(event_id) from e
        raise

def remove_like(db: Session, event_id: uuid.UUID, username: str) -> bool:
    # True if a like was removed, False if there wasn't one
    like = db.get(Like, (event_id, username))
    if like is None:
        return False
    db.delete(like)
    db.commit()
    return True