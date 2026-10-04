from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

class User(BaseModel):
    username: str
    email: str
    password: str
    banneduntil: str

class Event(BaseModel):
    id: str
    name: str
    reporter: str
    location: str
    times: list[list[str]]
    description: str
    tags: list[str]
    likes: list[str]


app = FastAPI()

users: list[User] = []
events: list[Event] = []

@app.get("/user")
def get_users(username: str = None):
    if (username is None):
        return users
    for user in users:
        if user.username == username:
            return user
    raise HTTPException(status_code = 404, detail = f"No user with username \"{username}\" found.")


@app.post("/user")
def post_user(user: User):
    for existing_user in users:
        if existing_user.username == user.username:
            raise HTTPException(status_code = 409, detail = f"User with username \"{existing_user.username}\" already exists.")
    users.append(user)
    return user

@app.get("/event")
def get_events():
    return events

@app.post("/event")
def post_event(event: Event):
    events.append(event)
    return event