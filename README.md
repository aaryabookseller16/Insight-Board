

# InsightBoard

**InsightBoard** is an internal analytics dashboard that tracks business health using event-level data.
It aggregates raw events into high-level KPIs such as revenue, activity, and trends, with strict role-based access control.

This is a **realistic internal tool**, not a toy app.

---

## What InsightBoard Shows

InsightBoard answers four core questions every product team asks:

1. **Are we making or losing money?**
   - Revenue = sales − refunds (stored safely in cents)
2. **Is the product being used?**
   - Total events
   - Active users
3. **How is the business trending over time?**
   - Daily revenue over the last 14 days
4. **What type of behavior dominates?**
   - Breakdown of event types (sale / refund / visit)

Admins see platform-wide metrics.  
Regular users only see their own data.

---

## Architecture Overview

```
┌────────────┐       ┌──────────────┐       ┌──────────────┐
│  React UI  │──────▶│  Express API │──────▶│  PostgreSQL  │
│  (Vite)    │ JWT   │              │ SQL   │              │
└────────────┘       └──────────────┘       └──────────────┘
```

### Backend
- Node.js + Express
- JWT authentication
- Role-based access control (RBAC)
- PostgreSQL for durable event storage
- Indexed time-series queries for KPI performance

### Frontend
- React (Vite)
- Token-based auth
- Lightweight SVG charting (no heavy UI frameworks)
- Clean, readable dashboard layout

---

## Data Model

### Users
```sql
users(
  id,
  email,
  password_hash,
  role,
  created_at
)
```

### Events
```sql
events(
  id,
  user_id,
  type,
  amount_cents,
  created_at
)
```

Money is stored in **cents** to avoid floating-point bugs.

---

## API Endpoints

### Auth
- POST /auth/register
- POST /auth/login

### User
- GET /me (auth required)

### KPIs
- GET /kpis/summary
- GET /kpis/daily
- GET /kpis/top

RBAC is enforced **on the backend**, not in the UI.

---

## Getting Started (Local)

### Requirements
- Node.js ≥ 18
- Docker + Docker Compose

---

### 1. Clone the repo
```bash
git clone <repo-url>
cd insightBoard
```

---

### 2. Environment variables
Create a `.env` file:
```env
DATABASE_URL=postgres://insight:insight@localhost:5432/insightboard
JWT_SECRET=dev-secret-change-me
PORT=3001
```

---

### 3. Start Postgres
```bash
docker compose up -d
```

---

### 4. Apply schema and seed data
```bash
docker exec -i insightboard-db-1 psql -U insight -d insightboard < db/schema.sql
docker exec -i insightboard-db-1 psql -U insight -d insightboard < db/seed.sql
```

---

### 5. Start backend
```bash
cd api
npm install
npm run dev
```

API runs at: http://localhost:3001

---

### 6. Start frontend
```bash
cd web
npm install
npm run dev
```

UI runs at: http://localhost:5173

---

## Demo Accounts

| Role  | Email             | Password |
|------ |------------------ |----------|
| Admin | admin@example.com | admin123 |
| User  | user1@example.com | user123  |

---

## License
MIT