from fastapi import FastAPI
from app.routers.auth import router as auth_router
from app.db.database import Base, engine
from app.models import User, Ticket, TicketActivity


app = FastAPI(
    title="Student Support & Ticket Management System",
    version="1.0.0",
)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Student Support API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }