# TransitOps — Frontend

React 19 + Vite + TypeScript + Tailwind CSS SPA for the TransitOps platform.

---

## 🛠️ Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 8
- **Language**: TypeScript 6
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **Data Fetching**: TanStack React Query v5
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Animations**: Framer Motion
- **PDF Export**: jsPDF + jsPDF-AutoTable
- **Icons**: Lucide React

---

## 📁 Folder Structure

```
frontend/
├── index.html
├── vite.config.ts           # Vite config + API proxy
└── src/
    ├── main.tsx              # App entry point
    ├── App.tsx               # Routes and layout
    ├── components/
    │   ├── auth/             # PermissionGuard, RoleGuard
    │   ├── layout/           # Sidebar, Header, AppShell
    │   ├── shared/           # Breadcrumbs, EmptyState, Toast, Skeletons
    │   └── ui/               # Base UI: Button, Card, Input, Badge, etc.
    ├── hooks/
    │   ├── useAuth.tsx        # Auth context and hook
    │   ├── useTheme.tsx       # Light/Dark mode
    │   ├── useNotifications.tsx
    │   └── useKeyboardShortcuts.ts
    ├── lib/
    │   ├── utils.ts           # cn() class merging utility
    │   └── currency.ts        # ₹ Indian currency formatting
    ├── pages/
    │   ├── auth/              # Login, Register, Verify Email, Reset Password
    │   ├── dashboard/         # Role-based dashboard redirect
    │   ├── dashboards/        # Per-role dashboards
    │   │   ├── FleetManagerDashboard.tsx
    │   │   ├── DriverDashboard.tsx
    │   │   ├── SafetyOfficerDashboard.tsx
    │   │   └── FinancialAnalystDashboard.tsx
    │   ├── vehicles/          # Vehicle list + detail
    │   ├── drivers/           # Driver list + detail
    │   ├── trips/             # Trip list + multi-step create wizard
    │   ├── maintenance/       # Maintenance logs
    │   ├── fuel/              # Fuel logs + expenses
    │   ├── reports/           # Analytics and charts
    │   ├── incidents/         # Incident reports
    │   ├── compliance/        # Compliance overview
    │   ├── audit/             # Audit trail
    │   ├── notifications/     # Notification centre
    │   ├── settings/          # App settings + email config
    │   └── profile/           # User profile
    ├── services/
    │   └── api.ts             # Axios instance with JWT interceptor
    ├── types/
    │   └── index.ts           # All TypeScript types/interfaces
    └── utils/
        ├── permissions.ts     # Frontend permission helpers
        └── validation.ts      # Zod schemas + field error helpers
```

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env` file

```env
VITE_API_URL=http://localhost:3000/api
```

> The Vite dev server already has a proxy configured: any `/api` request goes to `http://localhost:3000`. The `.env` variable is used for reference.

### 3. Start the dev server

```bash
npm run dev
# App runs at http://localhost:5174
```

> Make sure the backend is running first at `http://localhost:3000`.

---

## 📋 Scripts

```bash
npm run dev       # Start Vite dev server (http://localhost:5174)
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview the production build locally
npm run lint      # Run oxlint
```

---

## 🗺️ Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/verify-email` | Email Verification | Public |
| `/forgot-password` | Forgot Password | Public |
| `/reset-password` | Reset Password | Public |
| `/dashboard` | Role-based redirect | All roles |
| `/vehicles` | Vehicle list | Fleet Manager + |
| `/vehicles/:id` | Vehicle detail | Fleet Manager + |
| `/drivers` | Driver list | All roles |
| `/drivers/:id` | Driver detail | All roles |
| `/trips` | Trip list + create | Driver, Fleet Manager |
| `/maintenance` | Maintenance logs | Fleet Manager + |
| `/fuel-expenses` | Fuel & Expenses | Fleet Manager, Finance |
| `/reports` | Analytics & Reports | Fleet Manager, Finance |
| `/incidents` | Incidents | Safety Officer + |
| `/compliance` | Compliance overview | Safety Officer + |
| `/notifications` | Notifications | All roles |
| `/audit` | Audit logs | Fleet Manager |
| `/settings` | App settings | Fleet Manager |
| `/profile` | User profile | All roles |

---

## 🎨 UI Components

All base components live in `src/components/ui/`:

| Component | Description |
|---|---|
| `Button` | Primary, outline, ghost, destructive variants |
| `Card` / `CardContent` / `CardHeader` | Content containers |
| `Input` | Text, number, date inputs |
| `Select` | Native select dropdown |
| `Badge` | Status badges with variants |
| `Spinner` | Loading spinner |
| `Modal` | Accessible modal dialog |
| `SearchableSelect` | Searchable dropdown with sublabel |
| `DataTable` | Sortable, paginated table |
| `Pagination` | Page navigation |

Shared components in `src/components/shared/`:

| Component | Description |
|---|---|
| `Breadcrumbs` | Auto-generated from route |
| `PageTransition` | Framer Motion page fade |
| `EmptyState` | No-data placeholder with action |
| `TableSkeleton` | Loading skeleton for tables |
| `Toast` | Success / error / info notifications |
| `PermissionGuard` | Hides children if no permission |

---

## 🔐 Authentication Flow

1. User registers → verification email sent
2. User clicks link in email → account verified
3. User logs in → JWT stored in `localStorage`
4. Axios interceptor attaches `Authorization: Bearer <token>` to every request
5. On 401 response → user is logged out automatically

---

## 💰 Currency

All monetary values use Indian Rupee (₹) with `en-IN` locale formatting.

```ts
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency';

formatCurrency(1500000)        // → "₹15,00,000"
formatCurrencyCompact(1500000) // → "₹15.00L"
formatCurrencyCompact(15000000)// → "₹1.50Cr"
```

---

## 🌙 Dark Mode

Toggle between light and dark mode from the header. Preference is saved in `localStorage`.

---

## 🔒 Permission System

Every page and action is guarded by the `usePermission` hook:

```tsx
const { can } = usePermission();

// Show button only if user has permission
{can('fleet:create') && <Button>Add Vehicle</Button>}
```

Permissions are derived from the user's role. See `src/utils/permissions.ts` for the full map.

---

## 🔧 Vite Proxy

API calls go through Vite's proxy in development — no CORS issues:

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
},
```

---

## 🐛 Troubleshooting

**Blank page after login**
Make sure the backend is running at `http://localhost:3000`. Check the browser console for API errors.

**Port 5173 in use (falls back to 5174)**
This is normal. Vite auto-picks the next available port. The backend's `APP_URL` should match whichever port is used.

**`Cannot find module` errors**
Run `npm install` again.

**Charts not showing data**
Make sure the backend DB is seeded: `cd backend && npm run db:seed`.
