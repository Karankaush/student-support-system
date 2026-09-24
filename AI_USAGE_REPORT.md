# AI Usage Report

## 1. Purpose of AI Usage

AI tools were used as a development assistant during the implementation of the Student Support & Ticket Management System.

The developer remained responsible for understanding, reviewing, testing, and integrating the generated suggestions.

## 2. Areas Where AI Was Used

### Project Planning

AI was used to:
- Break the assignment requirements into implementation tasks.
- Define the initial backend and frontend architecture.
- Identify the main entities, workflows, and API responsibilities.
- Discuss assumptions and implementation trade-offs.

### Backend Development

AI assistance was used for:
- FastAPI route structure
- Pydantic schemas
- SQLAlchemy models
- SLA calculation
- Ticket ageing
- Ticket assignment
- Activity history
- API filtering
- Error handling

### Frontend Development

AI assistance was used for:
- Next.js page structure
- Login flow
- Student dashboard
- Ticket creation form
- Staff dashboard
- Ticket filtering
- Ticket management UI
- REST API integration

### Debugging

AI was used to analyze and resolve development issues encountered during implementation, including:
- Configuration/import issues
- Authentication-related issues
- Password hashing compatibility
- Frontend dependency/setup issues
- API integration issues

## 3. AI-Generated Code Validation

AI-generated code was not treated as automatically correct.

The implementation was validated by:

- Running the FastAPI application locally.
- Running the Next.js frontend locally.
- Testing API endpoints through the application and API documentation.
- Registering and authenticating users.
- Creating student tickets.
- Testing staff ticket access.
- Testing ticket assignment.
- Testing status and priority updates.
- Testing resolution updates.
- Verifying ticket ageing and SLA information.
- Verifying activity history.
- Testing student/staff access restrictions.

## 4. Human Review and Decisions

The developer reviewed and made decisions regarding:

- Project scope
- Database structure
- User roles
- Ticket statuses
- Ticket priorities
- SLA durations
- Authentication approach
- Authorization rules
- API structure
- Frontend workflow
- Assignment behavior
- Edge cases
- Trade-offs

The implementation was intentionally kept focused on the requirements of the assignment rather than adding unnecessary features.

## 5. AI Limitations Observed

AI-generated suggestions sometimes required correction or adaptation during implementation.

Examples included:
- Dependency/setup issues
- Import/configuration mistakes
- Compatibility issues between packages
- Adjustments required to match the existing project structure
- Changes required during frontend setup

These issues were identified through local execution and testing rather than being accepted without validation.

## 6. Final Validation

The completed system was tested through an end-to-end workflow:

Student:
1. Register/login
2. Create a support ticket
3. Select category and priority
4. View ticket status, ageing and SLA

Staff:
1. Login
2. View tickets
3. Filter tickets
4. Assign a ticket
5. Update status and priority
6. Add resolution
7. Review activity history

The final implementation was reviewed against the assignment requirements before submission.