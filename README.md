# 🚛 TransitOps — Smart Transport Operations Platform

> Built for **Odoo Hackathon 2026** · Full-stack fleet management system for Indian logistics operations.

TransitOps helps fleet managers, dispatchers, drivers, safety officers, and financial analysts manage vehicles, trips, drivers, fuel, expenses, maintenance, compliance, and reporting — all in one place.

---

## 📸 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (access tokens) + Email verification |
| Email | Nodemailer (Gmail SMTP / any SMTP) |
| Charts | Recharts |
| PDF Export | jsPDF + jsPDF-AutoTable |

---

## 📁 Project Structure

```
TransitOps/
├── backend/          # Express + Prisma API server
│   ├── prisma/       # Database schema
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       ├── jobs/
│       └── utils/
├── frontend/         # React + Vite SPA
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── lib/
└── Assets/           # Screenshots and documents
```

---

## 🚀 Quick Start (Full Setup)

> Prerequisites: **Node.js ≥ 18**, **PostgreSQL running locally**

### Step 1 — Clone the repository

```bash
git clone https://github.com/Adarsh261206/TransitOps.git
cd TransitOps
```

### Step 2 — Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
# Database
DATABASE_URL="postgresql://YOUR_PG_USER@localhost:5432/transitops?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:5174

# Email (Gmail App Password recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENDER_EMAIL=your-email@gmail.com
SENDER_NAME=TransitOps
```

> 💡 To find your PostgreSQL username, run `psql -c "\du"` in terminal.

Create the database, push schema, and seed data:

```bash
# Create database (run from terminal, not inside psql)
psql -c "CREATE DATABASE transitops;"

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample Indian data
npm run db:seed
```

Start the backend server:

```bash
npm run dev
# Server starts at http://localhost:3000
```

### Step 3 — Setup Frontend

Open a **new terminal tab**:

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:3000/api
```

Start the frontend:

```bash
npm run dev
# App starts at http://localhost:5174
```

### Step 4 — Open the App

Go to **http://localhost:5174** in your browser.

---

## 🔐 Default Login Credentials

All accounts use password: `password123`

| Role | Email |
|---|---|
| Fleet Manager | fleet@transitops.com |
| Dispatcher | dispatcher@transitops.com |
| Driver | driver@transitops.com |
| Safety Officer | safety@transitops.com |
| Financial Analyst | finance@transitops.com |

---

## ✨ Features

### 🚗 Fleet Management
- Add, edit, retire vehicles
- Track odometer, fuel average, region
- Monitor insurance, PUC, fitness, permit expiry dates
- Vehicle document uploads

### 👨‍✈️ Driver Management
- Driver profiles with license, medical, and insurance details
- Safety scores and violation tracking
- Automatic license expiry monitoring
- Suspend / activate drivers

### 📦 Trip Management
- Multi-step trip creation wizard
- Assign vehicle + driver
- Dispatch, track, complete or cancel trips
- Record actual distance, fuel consumed, revenue, toll on completion

### 🛠️ Maintenance
- Log scheduled and emergency maintenance
- Track costs, vendors, expected completion
- Priority levels (Low → Critical)
- Close maintenance and record actual cost

### ⛽ Fuel & Expenses
- Log fuel fill-ups per vehicle
- Track all expense types: Toll, Repair, Insurance, Fine, Salary, Parking
- Aggregated totals and per-vehicle breakdown

### 📊 Analytics & Reports
- Fleet utilization pie chart
- Monthly cost trends (fuel + expenses)
- Vehicle ROI analysis
- Operational cost breakdown
- Driver performance leaderboard
- Export as CSV or PDF

### 🔔 Notifications & Alerts
- Auto alerts for expiring licenses, PUC, insurance, fitness, permits
- Unread notification badge
- In-app notification centre

### 🔒 Role-Based Access Control
- 5 roles with granular permissions
- Every route and UI element respects permissions

### 📧 Email System
- Email verification on signup
- Password reset via email
- Automated license & document expiry reminders (cron jobs)
- SMTP settings configurable from the UI (Fleet Manager only)

### 🔍 Audit Logs
- Complete audit trail of all actions
- Who did what and when

---

## 📋 Available Scripts

### Backend

```bash
npm run dev          # Start with hot reload (tsx watch)
npm run build        # Compile TypeScript
npm run start        # Run compiled build
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema changes to DB
npm run db:migrate   # Run migrations
npm run db:seed      # Seed sample Indian data
```

### Frontend

```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run oxlint
```

---

## 🌐 API Overview

Base URL: `http://localhost:3000/api`

| Module | Endpoint |
|---|---|
| Auth | `/api/auth` |
| Vehicles | `/api/vehicles` |
| Drivers | `/api/drivers` |
| Trips | `/api/trips` |
| Maintenance | `/api/maintenance` |
| Fuel | `/api/fuel` |
| Expenses | `/api/expenses` |
| Reports | `/api/reports` |
| Notifications | `/api/notifications` |
| Audit Logs | `/api/audit` |
| Dashboard | `/api/dashboard` |
| Email Settings | `/api/email` |

Health check: `GET http://localhost:3000/api/health`

---

## 🐛 Common Issues

### PostgreSQL user not found
Run `psql -c "\du"` to find your username and update `DATABASE_URL` accordingly.

### Port already in use
```bash
# Kill whatever is running on port 3000
kill -9 $(lsof -ti:3000)
```

### Prisma client not generated
```bash
cd backend
npm run db:generate
```

### Email not sending
- Make sure you're using a **Gmail App Password**, not your regular password
- Enable 2FA on Gmail first, then generate an App Password from Google Account → Security

---

## 📄 License

MIT — Built with ❤️ for Odoo Hackathon 2026
