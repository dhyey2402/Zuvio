from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Zuvio API",
    description="The secure backend API for the Zuvio file storage platform.",
    version="1.0.0",
)

# Configure CORS
origins = [
    "http://localhost:3000",
    # Add other allowed origins here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Zuvio API."}
