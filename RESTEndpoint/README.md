# REST Endpoint
The Buzz Bitez REST Endpoint is how we connect our front end code to our backend code. Instructions on how to use it are below:

### Bootup
Run the following in powershell to boot up the endpoint:
```powershell
python -m uvicorn RESTEndpoint:app --reload
```
You may need to first install univorn, fastapi, and pydantic before this will run.

### Endpoints
There are two endpoints you can connect to: The "/user" endpoint, and the "/event" endpoint. We currently support:

- **GET** (all entries or individual entries)
- **POST** (individual entry)
- **DELETE** (individual entry)

Note that when specifying an individual entry with **GET** or **DELETE**, your query string must provide the value of the `username` or `event_id` of the target user or event respectively.

### Data Types
The schema for our datatypes can be seen below:
```py
class User:
    username: str # Must be unique
    email: str
    password: str
    banneduntil: str
```
```py
class Event:
    event_id: str # Must be unique
    name: str
    reporter: str
    location: str
    times: list[list[str]]
    description: str
    tags: list[str]
    likes: list[str]
```
### Database setup (local development)
Requires Docker and Python 3.11+. From the `RESTEndpoint` folder:
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then set your own password in .env
docker compose up -d          # starts Postgres on localhost:5432
alembic upgrade head          # creates the tables
```
To wipe the database and start fresh: `docker compose down -v`, then `docker compose up -d` and `alembic upgrade head` again.

Schema changes go through Alembic: edit `models.py`, run `alembic revision --autogenerate -m "describe change"`, review the generated file in `migrations/versions/`, then `alembic upgrade head`. Pull `main` before generating a migration so the history doesn't fork.
