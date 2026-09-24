from datetime import datetime

from pydantic import BaseModel

from app.models.ticket import (
    TicketCategory,
    TicketPriority,
    TicketStatus,
)


class TicketCreate(BaseModel):
    title: str
    description: str
    category: TicketCategory
    priority: TicketPriority = TicketPriority.MEDIUM


class TicketUpdate(BaseModel):
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    resolution: str | None = None


class TicketAssign(BaseModel):
    staff_id: int


class TicketResponse(BaseModel):
    id: int
    student_id: int
    assigned_to: int | None

    title: str
    description: str

    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus

    created_at: datetime
    updated_at: datetime
    due_at: datetime | None
    resolved_at: datetime | None
    resolution: str | None

    model_config = {
        "from_attributes": True
    }



class ActivityResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int
    action: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }