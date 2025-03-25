from environment import environment
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from routers import progress

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=environment.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include progress-related endpoints
app.include_router(progress.router)

handler = Mangum(app, lifespan="off")
