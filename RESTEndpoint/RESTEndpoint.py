from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

class User(BaseModel):
    username: str # Key
    email: str
    password: str
    banneduntil: str

    def __eq__(self, other):
        if not isinstance(other, User):
            return False
        # No 2 Users can have the same name
        return self.username == other.username

    def __hash__(self):
        return hash(self.username)

class Event(BaseModel):
    event_id: str # Key
    name: str
    reporter: str
    location: str
    times: list[list[str]]
    description: str
    tags: list[str]
    likes: list[str]

    def __eq__(self, other):
        if not isinstance(other, Event):
            return False
        # No 2 Events can have the same event_id
        return self.event_id == other.event_id

    def __hash__(self):
        return hash(self.event_id)


app = FastAPI()

users: list[User] = []
events: list[Event] = []

@app.get("/user")
def get_users(username: str | None = None):
    if username is None:
        return users
    for user in users:
        if user.username == username:
            return user
    raise HTTPException(status_code = 404, detail = f"No user with username {username} found.")


@app.post("/user")
def post_user(user: User):
    if user in users:
        raise HTTPException(status_code = 409, detail = f"User with username {user.username} already exists.")
    users.append(user)
    return user

@app.delete("/user")
def delete_user(username: str):
    for user in users:
        if user.username == username:
            users.remove(user)
            return user
    raise HTTPException(status_code = 404, detail = f"No user with username {username} found.")

@app.get("/event")
def get_events(event_id: str | None = None):
    if event_id is None:
        return events
    for event in events:
        if event.event_id == event_id:
            return event
    raise HTTPException(status_code = 404, detail = f"No event with event_id {event_id} found.")

@app.post("/event")
def post_event(event: Event):
    if event in events:
        raise HTTPException(status_code = 409, detail = f"Event with event_id {event.event_id} already exists.")
    events.append(event)
    return event

@app.delete("/event")
def delete_event(event_id: str):
    for event in events:
        if event.event_id == event_id:
            events.remove(event)
            return event
    raise HTTPException(status_code = 404, detail = f"No event with event_id {event_id} found.")