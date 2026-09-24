# Student Support & Ticket Management System

A backend-focused student support ticket management system built with FastAPI and Next.js.

## Problem

The system helps students raise support requests and allows support staff to manage, assign, track, and resolve tickets.

## Key Features

### Student
- Register and login
- Create support tickets
- Select category and priority
- View own tickets
- Track ticket status
- Track SLA due time
- View ticket ageing

### Support Staff
- View all tickets
- Filter tickets by status and priority
- Assign tickets
- Update ticket status
- Change priority
- Add resolution
- View activity history
- Track ageing and SLA information

## Technology Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT Authentication
- Pydantic
- Pytest

### Frontend
- Next.js
- React
- Tailwind CSS

## Architecture

Frontend (Next.js)
        |
        | REST API
        v
Backend (FastAPI)
        |
        v
SQLAlchemy
        |
        v
PostgreSQL

## Data Model

### Users
Stores student and staff accounts.

### Tickets
Stores support requests, priority, status, assignment, SLA and resolution information.

### Ticket Activities
Stores important ticket actions for activity history and traceability.

## SLA

SLA is calculated based on ticket priority:

- High: 24 hours
- Medium: 48 hours
- Low: 72 hours

## Authentication

JWT-based authentication is used for API access.

Students can access only their own tickets.

Staff members can manage tickets.

## Important Assumptions

- New registrations create student accounts.
- Staff accounts are created separately.
- A ticket is assigned to support staff.
- Resolving a ticket records the resolution timestamp.
- Ticket ageing is calculated from ticket creation time.
- SLA duration depends on priority.

## Edge Cases Considered

- Duplicate user registration
- Invalid login credentials
- Unauthorized ticket access
- Invalid ticket ID
- Invalid staff assignment
- Invalid status/priority values
- Unassigned tickets
- Tickets with no resolution
- Authentication failure

## Running Locally

### Backend

```bash
cd backend
uvicorn app.main:app --reload

cd frontend
npm run dev


Backend:

http://127.0.0.1:8000

Frontend:

http://localhost:3000

API documentation:

http://127.0.0.1:8000/docs

Staff Test Account

Email:

staff@college.com

Password:

staff123

Trade-offs

The implementation intentionally keeps the system simple and focused on the assignment requirements.

The frontend uses direct REST API calls instead of adding a state-management library.

Ticket ageing is calculated dynamically rather than stored as a database field.

Staff assignment is kept simple through the authenticated staff user's identity.

Future Improvements

Possible production improvements include:

Pagination for large ticket volumes
Email notifications
More granular permissions
Background SLA escalation jobs
Audit logging improvements
Automated API and frontend test coverage
