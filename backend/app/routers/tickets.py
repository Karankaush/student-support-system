from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_staff
from app.models.activity import TicketActivity
from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.user import User
from app.schemas.ticket import (
    ActivityResponse,
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


def add_activity(
    db: Session,
    ticket_id: int,
    user_id: int,
    action: str,
):
    activity = TicketActivity(
        ticket_id=ticket_id,
        user_id=user_id,
        action=action,
    )

    db.add(activity)


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
    db.flush()

    add_activity(
        db,
        ticket.id,
        current_user.id,
        "Ticket created",
    )

    db.commit()
    db.refresh(ticket)

    return ticket


@router.get("", response_model=list[TicketResponse])
def list_tickets(
    status_filter: TicketStatus | None = None,
    priority: TicketPriority | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.value == "student":
        stmt = select(Ticket).where(
            Ticket.student_id == current_user.id
        )
    else:
        stmt = select(Ticket)

    if status_filter is not None:
        stmt = stmt.where(Ticket.status == status_filter)

    if priority is not None:
        stmt = stmt.where(Ticket.priority == priority)

    stmt = stmt.order_by(Ticket.created_at.desc())

    return db.scalars(stmt).all()



@router.get("/summary")
def ticket_summary(
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db),
):
    tickets = db.scalars(select(Ticket)).all()

    return {
        "total": len(tickets),
        "open": sum(t.status == TicketStatus.OPEN for t in tickets),
        "in_progress": sum(
            t.status == TicketStatus.IN_PROGRESS
            for t in tickets
        ),
        "pending": sum(
            t.status == TicketStatus.PENDING
            for t in tickets
        ),
        "resolved": sum(
            t.status == TicketStatus.RESOLVED
            for t in tickets
        ),
        "closed": sum(
            t.status == TicketStatus.CLOSED
            for t in tickets
        ),
    }


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

    add_activity(
        db,
        ticket.id,
        current_user.id,
        f"Ticket assigned to staff #{staff.id}",
    )

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

        add_activity(
            db,
            ticket.id,
            current_user.id,
            f"Status changed to {data.status.value}",
        )

        if data.status == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.now(timezone.utc)

    if data.priority is not None:
        ticket.priority = data.priority

        add_activity(
            db,
            ticket.id,
            current_user.id,
            f"Priority changed to {data.priority.value}",
        )

    if data.resolution is not None:
        ticket.resolution = data.resolution

        add_activity(
            db,
            ticket.id,
            current_user.id,
            "Resolution added",
        )

    ticket.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(ticket)

    return ticket


@router.get(
    "/{ticket_id}/activities",
    response_model=list[ActivityResponse],
)
def get_ticket_activities(
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
            detail="You can only access your own ticket history",
        )

    stmt = (
        select(TicketActivity)
        .where(TicketActivity.ticket_id == ticket_id)
        .order_by(TicketActivity.created_at.asc())
    )

    return db.scalars(stmt).all()