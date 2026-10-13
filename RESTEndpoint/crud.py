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


class UserNotFound(Exception):
    pass


class UserHasEvents(Exception):
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


def _user_to_dict(user: User) -> dict:
    # Public fields only. password_hash never leaves this module.
    return {
        "username": user.username,
        "email": user.email,
        "banned_until": user.banned_until.isoformat() if user.banned_until else None,
    }


def _constraint(e: IntegrityError) -> str | None:
    return e.orig.diag.constraint_name


# users

def create_user(db: Session, username: str, email: str, password_hash: str) -> dict:
    user = User(username=username, email=email, password_hash=password_hash)
    db.add(user)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        if _constraint(e) == "users_pkey":
            raise UsernameTaken(username) from e
        if _constraint(e) == "users_email_key":
            raise EmailTaken(email) from e
        raise
    return _user_to_dict(user)


def list_users(db: Session) -> list[dict]:
    return [_user_to_dict(u) for u in db.scalars(select(User).order_by(User.username))]


def get_user(db: Session, username: str) -> dict | None:
    # Return the user's public fields, or None if not found
    user = db.get(User, username)
    return _user_to_dict(user) if user else None


def delete_user(db: Session, username: str) -> bool:
    # True if deleted, False if no such user.
    # Raises UserHasEvents if they reported events (the foreign key blocks it).
    # Their likes are removed automatically by ON DELETE CASCADE.
    user = db.get(User, username)
    if user is None:
        return False
    db.delete(user)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        if _constraint(e) == "events_reporter_fkey":
            raise UserHasEvents(username) from e
        raise
    return True

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
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        if _constraint(e) == "events_reporter_fkey":
            raise UserNotFound(reporter) from e
        raise
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
        if _constraint(e) == "likes_pkey":
            return False
        if _constraint(e) == "likes_event_id_fkey":
            raise EventNotFound(event_id) from e
        if _constraint(e) == "likes_username_fkey":
            raise UserNotFound(username) from e
        raise


def remove_like(db: Session, event_id: uuid.UUID, username: str) -> bool:
    # True if a like was removed, False if there wasn't one
    like = db.get(Like, (event_id, username))
    if like is None:
        return False
    db.delete(like)
    db.commit()
    return True
