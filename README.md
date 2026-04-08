# Credit Card Management System

Full-stack app for tracking credit cards, logging transactions, and viewing spending insights.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Chart.js
- Backend: Node.js, Express, MySQL, JWT, bcrypt, dotenv

## Frontend

The frontend lives in `frontend/` and is built as a single-page app.

- `Login` and `Register` handle authentication
- `Dashboard` shows totals, recent activity, and charts
- `Add New` adds a credit card
- `Transactions` lists and creates debit/credit entries
- `Reports` shows spending trends and comparisons
- `Settings` updates profile, deletes cards, and runs reset actions

Protected routes use a JWT stored in `localStorage`.

## Backend

The backend lives in `backend/` and exposes a REST API for auth, cards, transactions, and settings.

Main endpoints:

- `POST /register`
- `POST /login`
- `GET /cards`
- `POST /cards`
- `DELETE /cards/:id`
- `GET /transactions`
- `POST /transactions`
- `PUT /settings/profile`
- `DELETE /settings/hard-reset`
- `POST /settings/reset-monthly`

## Database

`backend/schema.sql` includes the `cards` and `transactions` tables plus sample data.

Note: it references a `users` table, so that table must already exist in MySQL.

## Run Locally

```bash
# backend
cd backend
npm install
npm run dev

# frontend
cd frontend
npm install
npm run dev
```

## Environment

Create `backend/.env`:

```env
PORT=8120
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=ccms
JWT_SECRET=your_jwt_secret
```

## Notes

- Frontend API calls are currently hardcoded to `http://localhost:8120`
- No backend tests are set up yet
- Swagger packages are installed but not currently used
