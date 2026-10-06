import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str]
    banned_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(200))
    reporter: Mapped[str] = mapped_column(ForeignKey("users.username"))
    location: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    times: Mapped[list["EventTime"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True, order_by="EventTime.starts_at"
    )
    tags: Mapped[list["EventTag"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True
    )
    likes: Mapped[list["Like"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True
    )


class EventTime(Base):
    __tablename__ = "event_times"
    __table_args__ = (CheckConstraint("ends_at > starts_at", name="ends_after_start"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class EventTag(Base):
    __tablename__ = "event_tags"

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), primary_key=True
    )
    tag: Mapped[str] = mapped_column(String(50), primary_key=True)


class Like(Base):
    __tablename__ = "likes"

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), primary_key=True
    )
    username: Mapped[str] = mapped_column(
        ForeignKey("users.username", ondelete="CASCADE"), primary_key=True
    )
