# Finance Dashboard Backend

Node + Express + MongoDB (Atlas friendly) backend for a role-based finance dashboard. The code uses a simple MVC-ish layout (routes → controllers → models) with JWT auth and clear role enforcement.

## Quickstart
1. Clone / open this folder.
2. Copy `.env.example` to `.env` and fill in values:
   - `MONGODB_URI` – Atlas connection string
   - `DB_NAME` – database name (defaults to `finance_dashboard` if omitted)
   - `JWT_SECRET` – any random string
   - `PORT` – optional, defaults to 4000
3. Install dependencies
```bash
npm install
```
4. Run the server (with reload):
```bash
npm run dev
```
   Or production:
```bash
npm start
```

When the server boots it connects to MongoDB first, then listens on the configured port.

## First admin bootstrap
The first registered user is automatically given the `admin` role so you can manage others. Subsequent registrations default to `viewer` unless the caller is already an admin and passes a desired role.

## API Overview
Base URL: `http://localhost:4000`

### Auth
- `POST /api/auth/register` — create user. Body: `{ name, email, password, role? }`. Role is only honored for admins; first user becomes admin automatically.
- `POST /api/auth/login` — returns `{ token, user }`.

### Users (admin only)
- `GET /api/users` — list users; optional query `role`, `status`.
- `PATCH /api/users/:id` — update `role` or `status`.
- `POST /api/users/:id/deactivate` — marks user inactive (not for admins).

### Records
Authenticated users can read their own records. Admins see all. Analysts/Admins can write.
- `POST /api/records` — create. Body: `amount`, `type` (`income|expense`), `category`, `date?`, `notes?`.
- `GET /api/records` — list with filters `type`, `category`, `startDate`, `endDate`, `page`, `limit`.
- `GET /api/records/:id` — fetch single.
- `PATCH /api/records/:id` — update (analyst/admin, must own unless admin).
- `DELETE /api/records/:id` — soft delete (sets `isDeleted=true`).

### Dashboard
- `GET /api/dashboard/summary` — returns totals (income, expense, net), category totals, recent 5 items, and last 12 months trend. Respects role scoping (non-admins see their data only).

## Roles
- **viewer**: read-only (own records, dashboard).
- **analyst**: create/update/delete own records; read summaries.
- **admin**: full access to records and user management, sees all data.

## Validation & Errors
- Uses `express-validator` for request validation.
- Central error handler returns JSON `{ message, details? }` with appropriate status codes.

## Project Structure
```
src/
  app.js            // express app wiring
  server.js         // env load + DB connect + start server
  config/db.js      // Mongo connection
  constants/roles.js
  middleware/       // auth, role guard, error handler
  models/           // User, Record schemas
  controllers/      // auth, user, record, dashboard logic
  routes/           // route definitions
  utils/asyncHandler.js
```

## Frontend (React + Vite)
- Lives in `frontend/`.
- Setup: `cd frontend && npm install`
- Run: `npm run dev` (defaults to http://localhost:5173). `/api` requests proxy to http://localhost:4000.
- Pages: Auth (login/register), Dashboard summary, Records CRUD, Admin user management.

## Notes / Next steps
- Add tests (Jest/Supertest) for critical flows.
- Add pagination metadata for dashboards if needed.
- Consider rate limiting & request logging for production.
