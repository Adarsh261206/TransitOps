# TransitOps — Backend

Express + Prisma + PostgreSQL REST API for the TransitOps platform.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js ≥ 18
- **Framework**: Express 4
- **ORM**: Prisma 6
- **Database**: PostgreSQL
- **Language**: TypeScript 5
- **Auth**: JWT + bcryptjs
- **Email**: Nodemailer
- **Scheduler**: node-cron
- **Validation**: Zod

---

## 📁 Folder Structure

```
backend/
├── prisma/
│   └── schema.prisma        # All DB models and enums
└── src/
    ├── index.ts              # App entry point
    ├── seed.ts               # DB seed script
    ├── controllers/          # Route handlers
    │   ├── authController.ts
    │   ├── vehicleController.ts
    │   ├── driverController.ts
    │   ├── tripController.ts
    │   ├── maintenanceController.ts
    │   ├── fuelLogController.ts
    │   ├── expenseController.ts
    │   ├── reportController.ts
    │   ├── dashboardController.ts
    │   ├── notificationController.ts
    │   ├── auditController.ts
    │   ├── incidentController.ts
    │   ├── complianceController.ts
    │   ├── emailController.ts
    │   └── userController.ts
    ├── routes/               # Express routers
    ├── middleware/
    │   └── auth.ts           # JWT verify middleware
    ├── services/
    │   ├── email.ts          # Email send logic
    │   ├── emailTemplates.ts # HTML email templates
    │   ├── notification.ts   # Notification helpers
    │   └── audit.ts          # Audit log helpers
    ├── jobs/
    │   └── scheduler.ts      # Cron jobs (license/doc expiry)
    └── utils/
        ├── prisma.ts         # Prisma client singleton
        ├── permissions.ts    # Role-based permissions map
        └── validation.ts     # Zod validation schemas
```

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env` file

```env
# PostgreSQL connection string
# Find your username: psql -c "\du"
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/transitops?schema=public"

# JWT
JWT_SECRET="change-this-to-a-long-random-string"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (used in email links)
APP_URL=http://localhost:5174

# SMTP Email (use Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENDER_EMAIL=your-email@gmail.com
SENDER_NAME=TransitOps
```

### 3. Create the PostgreSQL database

```bash
psql -c "CREATE DATABASE transitops;"
```

### 4. Generate Prisma client

```bash
npm run db:generate
```

### 5. Push schema to database

```bash
npm run db:push
```

### 6. Seed sample data

```bash
npm run db:seed
```

This creates:
- 5 users (all roles, pre-verified)
- 5 Indian vehicles (Tata, Ashok Leyland, Mahindra, Eicher, BharatBenz)
- 4 Indian drivers with real license formats
- 35 trips (30 completed + 5 active) spread over 6 months
- 96 fuel logs across 6 months
- 54 expenses (toll, repair, insurance, fine, salary, parking)
- 12 maintenance logs
- 7 incidents
- 10 notifications + 10 audit logs

### 7. Start development server

```bash
npm run dev
# Starts at http://localhost:3000 with hot reload
```

---

## 📋 Scripts

```bash
npm run dev          # Start with tsx watch (hot reload)
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled production build
npm run db:generate  # Generate/regenerate Prisma client
npm run db:push      # Sync schema to DB (no migration files)
npm run db:migrate   # Run migrations (creates migration files)
npm run db:seed      # Seed sample data
```

---

## 🔌 API Endpoints

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/login` | Login, returns JWT |
| POST | `/logout` | Logout |
| GET | `/me` | Get current user |
| POST | `/verify-email` | Verify email with token |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password` | Reset password with token |

### Vehicles — `/api/vehicles`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List vehicles (paginated, filterable) |
| POST | `/` | Create vehicle |
| GET | `/:id` | Get vehicle details |
| PATCH | `/:id` | Update vehicle |
| DELETE | `/:id` | Delete vehicle |
| PATCH | `/:id/status` | Change vehicle status |
| POST | `/:id/documents` | Upload document |

### Drivers — `/api/drivers`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List drivers |
| POST | `/` | Add driver |
| GET | `/:id` | Driver details |
| PATCH | `/:id` | Update driver |
| DELETE | `/:id` | Delete driver |
| PATCH | `/:id/suspend` | Suspend driver |
| PATCH | `/:id/activate` | Activate driver |

### Trips — `/api/trips`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List trips (filterable) |
| POST | `/` | Create trip |
| GET | `/:id` | Trip details |
| PATCH | `/:id` | Update trip |
| DELETE | `/:id` | Delete trip |
| PATCH | `/:id/status` | Change trip status |

### Maintenance — `/api/maintenance`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List maintenance logs |
| POST | `/` | Create log |
| PATCH | `/:id` | Update log |
| DELETE | `/:id` | Delete log |
| PATCH | `/:id/close` | Close maintenance |

### Fuel — `/api/fuel`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List fuel logs |
| POST | `/` | Add fuel log |
| DELETE | `/:id` | Delete log |

### Expenses — `/api/expenses`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List expenses |
| POST | `/` | Add expense |
| DELETE | `/:id` | Delete expense |

### Reports — `/api/reports`
| Method | Path | Description |
|---|---|---|
| GET | `/fleet-utilization` | Vehicle utilization stats |
| GET | `/fuel-efficiency` | Fuel efficiency per vehicle |
| GET | `/operational-cost` | Cost breakdown per vehicle |
| GET | `/vehicle-roi` | ROI per vehicle |
| GET | `/summary` | Overall operational summary |
| GET | `/driver-performance` | Driver stats and ranking |
| GET | `/trends` | Monthly trends (fuel, expenses, trips) |

### Dashboard — `/api/dashboard`
| Method | Path | Description |
|---|---|---|
| GET | `/fleet-manager` | Fleet Manager KPIs |
| GET | `/dispatcher` | Dispatcher KPIs |
| GET | `/safety-officer` | Safety Officer KPIs |
| GET | `/financial-analyst` | Financial Analyst KPIs |

### Other
| Module | Base Path |
|---|---|
| Notifications | `/api/notifications` |
| Audit Logs | `/api/audit` |
| Incidents | `/api/incidents` |
| Email Settings | `/api/email` |
| Users | `/api/users` |

---

## 👥 Roles & Permissions

| Permission | Fleet Manager | Dispatcher | Driver | Safety Officer | Financial Analyst |
|---|:---:|:---:|:---:|:---:|:---:|
| Fleet CRUD | ✅ | 👁️ | 👁️ | 👁️ | 👁️ |
| Driver CRUD | ✅ | 👁️ | 👁️ | ✅ | 👁️ |
| Trips | 👁️ | ✅ | ✅ | 👁️ | 👁️ |
| Maintenance | ✅ | ❌ | ❌ | ❌ | 👁️ |
| Fuel & Expenses | ✅ | ❌ | ❌ | ❌ | ✅ |
| Reports & Analytics | ✅ | ❌ | ❌ | ❌ | ✅ |
| Settings | ✅ | 👁️ | ❌ | ❌ | ❌ |
| Incidents | ❌ | ❌ | ❌ | ✅ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ |

> ✅ = Full access · 👁️ = Read only · ❌ = No access

---

## ⏰ Background Jobs (Cron)

Runs automatically when server starts:

| Job | Schedule | Description |
|---|---|---|
| License Expiry Check | Daily 8 AM | Notifies managers when driver licenses expire in 30/15/7/3/1/0 days |
| Vehicle Document Check | Daily 8:30 AM | Alerts for expiring PUC, insurance, fitness, permit |
| Token Cleanup | Daily 2 AM | Removes expired email verification and password reset tokens |

---

## 🗄️ Database Models

`User` · `Vehicle` · `Driver` · `Trip` · `MaintenanceLog` · `FuelLog` · `Expense` · `Notification` · `VehicleDocument` · `Incident` · `AuditLog` · `EmailVerificationToken` · `PasswordResetToken` · `EmailLog` · `EmailTemplate` · `EmailSetting`

See full schema: [`prisma/schema.prisma`](./prisma/schema.prisma)

---

## 🐛 Troubleshooting

**`role "postgres" does not exist`**
Run `psql -c "\du"` to get your actual username and use it in `DATABASE_URL`.

**`Cannot find module '@prisma/client'`**
Run `npm run db:generate` first.

**Port 3000 already in use**
```bash
kill -9 $(lsof -ti:3000)
```

**Email not sending — "Missing credentials for PLAIN"**
Check that `SMTP_USER` and `SMTP_PASS` are both set in `.env`. For Gmail, use an App Password (not your regular password).
