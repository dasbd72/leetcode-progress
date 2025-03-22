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
        "huiyuiui",
        "kevin1010607",
    ]
    response = {}
    for user_slug in user_slugs:
        try:
            response[user_slug] = fetch_question_progress(user_slug)
        except Exception as e:
            print(f"Failed to fetch {user_slug}, error: {e}")
            response[user_slug] = {
                "EASY": 0,
                "MEDIUM": 0,
                "HARD": 0,
                "TOTAL": 0,
            }
    return response


handler = Mangum(app, lifespan="off")
