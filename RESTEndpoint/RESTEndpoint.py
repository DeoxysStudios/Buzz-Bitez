from fastapi import FastAPI
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

users = []
events = []

@app.get("/user")
def get_users():
    return users

@app.post("/user")
def post_user(user: Event):
    users.append(user.model_dump())
    return user

@app.get("/event")
def get_events():
    return events

@app.post("/event")
def post_event(event: Event):
    events.append(event.model_dump())
    return event