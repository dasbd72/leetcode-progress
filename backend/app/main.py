from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from utils import fetch_question_progress
from cache import is_cache_fresh, get_cache, put_cache

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
        "tatammmmy",
    ]
    response = {}
    if is_cache_fresh():
        # Fetch the cache
        response = get_cache()
        # Check if all user slugs are in the cache
        if all(user_slug in response for user_slug in user_slugs):
            response = {
                user_slug: response[user_slug] for user_slug in user_slugs
            }
            return response
    # If cache is not fresh or some user slugs are missing, fetch the data
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
    # Put the response in the cache
    put_cache(response)
    return response


handler = Mangum(app, lifespan="off")
