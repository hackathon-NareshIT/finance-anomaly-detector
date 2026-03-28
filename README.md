# finance-anomaly-detector
Millions of people in India lose money to unnoticed fraudulent transactions, billing errors, and impulsive overspending — simply because manually reviewing every bank transaction is tedious and impractical. Most people only notice a problem when it's too late. Finance Anomaly Detector is a full-stack web application that lets users upload their ban


# Finance Anomaly Detector — HackFest 2026

A full-stack web app that detects unusual spending patterns in personal finance data using Isolation Forest ML.

## Project Structure

```
finance-anomaly-detector/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Environment config
│   │   ├── database.py          # Supabase client
│   │   ├── models.py            # Pydantic schemas
│   │   ├── routes/
│   │   │   ├── auth.py          # Login / signup
│   │   │   └── transactions.py  # Upload CSV, get results
│   │   └── services/
│   │       ├── anomaly.py       # Isolation Forest logic
│   │       └── explainer.py     # Human-readable explanations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Dashboard.jsx
│   │   └── components/
│   │       ├── UploadZone.jsx
│   │       ├── MetricCards.jsx
│   │       ├── SpendingChart.jsx
│   │       └── TransactionList.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Setup

### 1. Supabase
1. Create project at supabase.com
2. Run this SQL in Supabase SQL editor:

```sql
create table scan_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  filename text,
  total_transactions int,
  anomaly_count int,
  results jsonb,
  created_at timestamp with time zone default now()
);

alter table scan_history enable row level security;
create policy "Users see own scans" on scan_history
  for all using (auth.uid() = user_id);
```

3. Enable Email Auth in Authentication > Providers

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
# Create .env file with your Supabase credentials
uvicorn app.main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
# Create .env file with your API URL
npm run dev
```

## Deploy
- Backend → Railway (connect GitHub repo, set env vars)
- Frontend → Vercel (connect GitHub repo, set env vars)
