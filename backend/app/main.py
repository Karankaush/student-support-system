from fastapi import FastAPI
from app.routers.auth import router as auth_router
from app.db.database import Base, engine
from app.routers.tickets import router as ticket_router
from app.models import User, Ticket, TicketActivity
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Student Support & Ticket Management System",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000" ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(ticket_router)


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