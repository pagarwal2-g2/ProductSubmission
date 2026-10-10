# Product Submission Workflow

A B2B Product & Vendor Management Platform built with FastAPI + React.

Vendors submit products (name, URL, logo, description, category) → stored as "pending" → admins approve or reject → products appear on the product dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.x |
| Database | PostgreSQL |
| Auth | Google OAuth2 + JWT (httpOnly cookie) |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |

---

## Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL running locally
- A Google Cloud project with OAuth2 credentials

---

## Step 1 — Google OAuth Setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new **OAuth 2.0 Client ID** → Web application
3. Add **Authorized redirect URI**: `http://localhost:8000/auth/google/callback`
4. Copy your **Client ID** and **Client Secret**

---

## Step 2 — Create the PostgreSQL Database

```bash
psql -U postgres
CREATE DATABASE product_submission;
\q
```

---

## Step 3 — Backend Setup

```bash
cd /Users/pinkyagarwal/ProductSubmission/backend

# Copy env file and fill in your values
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/product_submission
GOOGLE_CLIENT_ID=your-client-id-from-google
GOOGLE_CLIENT_SECRET=your-client-secret-from-google
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
JWT_SECRET=any-long-random-string-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:5173
```

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Start the backend (auto-creates DB tables on startup)
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API docs: http://localhost:8000/docs

---

## Step 4 — Frontend Setup

```bash
cd /Users/pinkyagarwal/ProductSubmission/frontend

# Dependencies already installed. Just start:
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Step 5 — First Login (becomes Admin)

1. Open http://localhost:5173
2. Click **Sign in with Google**
3. Complete Google OAuth flow
4. **The very first user to sign in automatically gets the Admin role**

---

## Screens & Navigation

| Screen | URL | Description |
|--------|-----|-------------|
| Login | `/login` | Google OAuth sign-in |
| Product Dashboard | `/products` | List, search, filter, export products |
| Submit Product | `/submit` | G2-style product submission form |
| Product Detail | `/products/:id` | Full product info + Approve/Reject (admin) |
| Vendor Dashboard | `/vendors` | List, search vendors |
| Vendor Detail | `/vendors/:id` | Vendor info + their products |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/google/login` | — | Redirect to Google OAuth |
| GET | `/auth/google/callback` | — | OAuth callback, sets JWT cookie |
| GET | `/auth/me` | User | Current user info |
| POST | `/auth/logout` | User | Clear auth cookie |
| GET | `/products` | User | List products (search, filter, paginate) |
| POST | `/products` | User | Submit new product |
| GET | `/products/export/csv` | Admin | Download all products as CSV |
| GET | `/products/{id}` | User | Product detail |
| PATCH | `/products/{id}/status` | Admin | Approve or reject |
| DELETE | `/products/{id}` | Admin | Delete product |
| GET | `/vendors` | User | List vendors (search, paginate) |
| GET | `/vendors/{id}` | User | Vendor detail + products |
| DELETE | `/vendors/{id}` | Admin | Delete vendor + all their products |

---

## Database Schema

```
users          — Google-authenticated users (role: admin | vendor)
vendors        — Company/vendor records (created on product submission)
products       — Submitted products (status: pending | approved | rejected)
new_listings   — Audit log of product submission requests
```

---

## Project Structure

```
ProductSubmission/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy engine + session
│   ├── models.py            # ORM models (User, Vendor, Product, NewListing)
│   ├── schemas.py           # Pydantic v2 schemas
│   ├── auth.py              # JWT + Google OAuth helpers
│   ├── requirements.txt
│   ├── .env.example
│   └── routers/
│       ├── auth.py          # /auth/* endpoints
│       ├── products.py      # /products/* endpoints
│       └── vendors.py       # /vendors/* endpoints
└── frontend/
    ├── src/
    │   ├── App.tsx           # Router + layout
    │   ├── api.ts            # Axios client + TypeScript types
    │   ├── contexts/
    │   │   └── AuthContext.tsx
    │   ├── components/
    │   │   ├── TopNav.tsx
    │   │   ├── StatusBadge.tsx
    │   │   └── ProtectedRoute.tsx
    │   └── pages/
    │       ├── Login.tsx
    │       ├── ProductDashboard.tsx
    │       ├── ProductSubmission.tsx
    │       ├── ProductDetail.tsx
    │       ├── VendorDashboard.tsx
    │       └── VendorDetail.tsx
    ├── tailwind.config.js
    └── package.json
```
