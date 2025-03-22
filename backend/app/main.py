from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from utils import fetch_question_progress

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    user_slugs = [
        "ryanke91",
        "dasbd72",
        "johnson684",
        "erictsai90",
    ]
    response = {}
    for user_slug in user_slugs:
        response[user_slug] = fetch_question_progress(user_slug)
    return response


handler = Mangum(app, lifespan="off")
