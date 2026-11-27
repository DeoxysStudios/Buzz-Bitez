
# REST Endpoint

The Buzz Bitez REST Endpoint is how we connect our front end code to our backend code. Data is stored in Postgres (see **Database setup** below), so it survives server restarts.

### Bootup

First complete the database setup below once. Then, from the `RESTEndpoint` folder, start the database, activate the virtual environment, and run FastAPI:

```bash
docker compose up -d
source .venv/bin/activate
alembic upgrade head
python -m uvicorn RESTEndpoint:app --reload
```

Interactive docs for every endpoint (try requests straight from the browser): http://localhost:8000/docs

To run the frontend, open a separate terminal in the main `Buzz-Bitez` folder:

```bash
python3 -m http.server 5500
```

Open http://localhost:5500/home.html to access Buzz Bitez.

### Endpoints

| Method | Path | What it does | Errors |
|---|---|---|---|
| GET | `/users` | List users | |
| GET | `/users/{username}` | Get one user | 404 |
| POST | `/users` | Create a user (201) | 409 username or email taken, 422 invalid input |
| DELETE | `/users/{username}` | Delete a user (204) | 404, 409 if they still have reported events |
| POST | `/login` | Check credentials and create a signed session cookie; returns the user | 401 invalid credentials, 422 invalid input |
| GET | `/me` | Return the currently authenticated user | 401 not logged in or invalid session |
| POST | `/logout` | Clear the current login session (204) | |
| GET | `/events` | List events, newest first | |
| GET | `/events/{event_id}` | Get one event | 404, 422 malformed id |
| POST | `/events` | Create an event (201) | 422 invalid input or unknown reporter |
| PUT | `/events/{event_id}` | Replace every field of an event except `reporter` | 404, 422 |
| DELETE | `/events/{event_id}` | Delete an event and its times, tags, likes (204) | 404 |
| POST | `/events/{event_id}/likes` | Like an event; body `{"username": ...}` (204, liking twice is fine) | 404 event, 422 unknown user |
| DELETE | `/events/{event_id}/likes/{username}` | Remove a like (204) | |

Passwords are hashed (Argon2) before storage and are never returned by any endpoint. See `Testing/test.http` for example requests.

### Authentication

Buzz Bitez uses signed, HTTP-only session cookies to manage user authentication. This replaces the previous login method, which sent usernames and passwords through URL parameters.

Users log in by sending a `POST /login` request containing their username and password in the JSON request body:

```json
{
    "username": "exampleuser",
    "password": "examplepassword"
}
```

After successful authentication, FastAPI creates a signed session cookie that the browser stores. The frontend includes `credentials: "include"` when making authenticated requests so the browser sends the session cookie.

The `GET /me` endpoint retrieves the currently authenticated user's information using the session cookie. If no valid session exists, the endpoint returns a 401 Unauthorized response.

The `POST /logout` endpoint clears the session and returns 204 No Content. After logging out, requests to `/me` return 401 until the user logs in again.

For local development, the frontend runs at `http://localhost:5500` and the backend runs at `http://localhost:8000`. Both use `localhost` to maintain consistent cookie behavior.

Session cookies currently use development settings. Production deployment requires HTTPS, secure cookies, and appropriate cross-origin security settings.

### Data Types

What you send:

```py
class UserIn:
    username: str           # unique, 1-50 characters
    email: str              # valid email, unique
    full_name: str          # 1-100 characters, required
    password: str           # at least 8 characters
    allergens: list[str]    # optional, default empty

class LoginIn:
    username: str
    password: str

class EventIn:
    name: str          # 1-200 characters
    reporter: str      # username of an existing user (will come from login later)
    location: str      # 1-200 characters
    times: list[list[str]]  # [["start", "end"], ...] ISO 8601 with timezone, e.g. "2026-10-03T12:00:00-04:00"
    description: str | None      # optional
    tags: list[str]              # optional, 1-50 characters each, duplicates are removed
    image: str | None            # optional, the data url of the image
    enable_message_board: bool   # optional, default False
    allow_direct_messages: bool  # optional, default False
    food_type: str | None        # optional
    servings: int                # optional, default 0
```

`PUT /events/{event_id}` takes the same fields as `EventIn` except `reporter`.

**Allergen tags:** allergens are stored in `tags` with an `allergen:` prefix, e.g. `"allergen:gluten"`. The valid ids are listed in `JavaScript/allergens.js`. An event with no allergen tags means the reporter didn't list any, not that the food is allergen-free.

What you get back:

```py
class UserOut:
    username: str
    email: str
    full_name: str
    banned_until: str | None
    allergens: list[str]

class EventOut:
    event_id: str      # generated by the server
    name: str
    reporter: str
    location: str
    times: list[list[str]]
    description: str | None
    tags: list[str]
    likes: list[str]   # usernames
    image: str | None
    enable_message_board: bool
    allow_direct_messages: bool
    food_type: str | None
    servings: int
```

### Database setup (local development)

Requires Docker and Python 3.11+. From the `RESTEndpoint` folder:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then configure your local environment variables
docker compose up -d          # starts Postgres on localhost:5432
alembic upgrade head          # creates the tables
```

The `.env` file must contain the PostgreSQL configuration and a `SESSION_SECRET_KEY` for signing session cookies.

Generate a session secret using:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the generated value into your local `.env`:

```dotenv
SESSION_SECRET_KEY=your_generated_secret_here
ENVIRONMENT=development
```

Do not commit `.env` or real session secrets to Git. The `.env.example` file should contain placeholders only.

The project uses `itsdangerous` for signed sessions through Starlette's `SessionMiddleware`. This dependency is included in `requirements.txt`.

To wipe the database and start fresh: `docker compose down -v`, then `docker compose up -d` and `alembic upgrade head` again. **Warning:** This permanently deletes local database data.

Schema changes go through Alembic: edit `models.py`, run `alembic revision --autogenerate -m "describe change"`, review the generated file in `migrations/versions/`, then `alembic upgrade head`. Pull `main` before generating a migration so the history doesn't fork.
