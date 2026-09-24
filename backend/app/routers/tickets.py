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






@router.get("", response_model=list[TicketResponse])
def list_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.value == "student":
        stmt = select(Ticket).where(
            Ticket.student_id == current_user.id
        )
    else:
        stmt = select(Ticket)

    return db.scalars(stmt.order_by(Ticket.created_at.desc())).all()


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.get(Ticket, ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    if (
        current_user.role.value == "student"
        and ticket.student_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only access your own tickets",
        )

    return ticket




@router.patch(
    "/{ticket_id}/assign",
    response_model=TicketResponse,
)
def assign_ticket(
    ticket_id: int,
    data: TicketAssign,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db),
):
    ticket = db.get(Ticket, ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    staff = db.get(User, data.staff_id)

    if not staff or staff.role.value != "staff":
        raise HTTPException(
            status_code=400,
            detail="Invalid staff member",
        )

    ticket.assigned_to = staff.id

    if ticket.status == TicketStatus.OPEN:
        ticket.status = TicketStatus.IN_PROGRESS

    db.commit()
    db.refresh(ticket)

    return ticket




@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse,
)
def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db),
):
    ticket = db.get(Ticket, ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    if data.status is not None:
        ticket.status = data.status

        if data.status == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.now(timezone.utc)

    if data.priority is not None:
        ticket.priority = data.priority

    if data.resolution is not None:
        ticket.resolution = data.resolution

    ticket.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(ticket)

    return ticket