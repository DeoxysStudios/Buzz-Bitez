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