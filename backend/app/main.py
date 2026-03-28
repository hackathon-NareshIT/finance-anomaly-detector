from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, transactions
from app.database import engine
from app import models_db

models_db.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Finance Anomaly Detector API",
    description="Detects unusual spending patterns using Isolation Forest ML",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Finance Anomaly Detector API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}

