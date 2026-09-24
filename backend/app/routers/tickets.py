from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_staff
from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.user import User
from app.schemas.ticket import (
    TicketAssign,
    TicketCreate,
    TicketResponse,
    TicketUpdate,
)

router = APIRouter(prefix="/tickets", tags=["Tickets"])


SLA_HOURS = {
    TicketPriority.LOW: 72,
    TicketPriority.MEDIUM: 48,
    TicketPriority.HIGH: 24,
}


@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket(
    data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sla_hours = SLA_HOURS[data.priority]

    ticket = Ticket(
        student_id=current_user.id,
        title=data.title,
        description=data.description,
        category=data.category,
        priority=data.priority,
        status=TicketStatus.OPEN,
        due_at=datetime.now(timezone.utc) + timedelta(hours=sla_hours),
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket