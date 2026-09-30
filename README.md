# 🛍️ ShopWave — Modern Full-Stack E-Commerce Platform

A production-ready full-stack e-commerce web application designed with modern best practices, clean architecture, responsive design, and intuitive code structure.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | Tailwind CSS, Lucide Icons, React Router v7, React Hot Toast |
| **Backend** | Python + FastAPI | REST APIs, Automatic Swagger/OpenAPI docs |
| **Database** | SQLite (Dev) / PostgreSQL (Prod) | SQLAlchemy 2.0 ORM, Alembic migrations ready |
| **Authentication** | JWT (JSON Web Tokens) | OAuth2 Password Bearer flow, bcrypt password hashing |
| **Testing** | pytest + HTTPX | Automated API tests for auth & product CRUD |

---

## 📁 Project Structure

```text
ecommerce-platform/
├── backend/
│   ├── app/
│   │   ├── config.py         # App configuration & env settings
│   │   ├── database.py       # SQLAlchemy engine & session factory
│   │   ├── dependencies.py   # FastAPI auth & role dependencies
│   │   ├── models.py         # User and Product database models
│   │   ├── schemas.py        # Pydantic validation schemas
│   │   ├── security.py       # Password hashing & JWT creation/verification
│   │   ├── routers/
│   │   │   ├── auth.py       # Registration, Login, Current User (/auth/*)
│   │   │   └── products.py   # Full CRUD for products (/products/*)
│   │   └── main.py           # FastAPI app entry point & CORS configuration
│   ├── tests/
│   │   ├── conftest.py       # Test database fixture & test client
│   │   ├── test_auth.py      # Registration & authentication test suite
│   │   └── test_products.py  # Product CRUD & permissions test suite
│   ├── create_admin.py       # One-click Admin user creation script
│   ├── populate_db.py        # Database seeder with sample products
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment configuration
│
└── frontend/
    ├── src/
    │   ├── components/       # Reusable UI components (Navbar, Footer, Modals, Cards)
    │   ├── context/          # AuthContext (JWT) and CartContext (Local storage)
    │   ├── hooks/            # Custom hooks (e.g. useProducts)
    │   ├── layouts/          # MainLayout with header, main content, footer
    │   ├── pages/            # Home, Products, ProductDetail, Cart, Login, Register, Profile, Admin
    │   ├── services/         # Axios API client with automatic JWT token attachment
    │   ├── types/            # TypeScript interfaces & type definitions
    │   └── utils/            # Helper formatters (currency, dates)
    ├── package.json
    └── tailwind.config.js
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows Command Prompt:
.\venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with sample products
python populate_db.py

# Create the admin user
python create_admin.py

# Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```

FastAPI server runs at: `http://localhost:8000`  
Interactive Swagger API Documentation: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend

# Install npm packages
npm install

# Start the Vite development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔑 Default Credentials

| Role | Username | Email | Password |
|---|---|---|---|
| **Admin** | `admin` | `admin@example.com` | `Admin1234!` |
| **Customer** | *(Register via the UI or `/auth/register`)* | — | — |

---

## 🧪 Running Automated Tests

Run backend tests using `pytest`:

```bash
cd backend
pytest -v
```

All tests run on an isolated in-memory SQLite database without modifying your development database.
