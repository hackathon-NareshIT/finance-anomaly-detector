# finance-anomaly-detector
Millions of people in India lose money to unnoticed fraudulent transactions, billing errors, and impulsive overspending — simply because manually reviewing every bank transaction is tedious and impractical. Most people only notice a problem when it's too late. Finance Anomaly Detector is a full-stack web application that lets users upload their bank statements and automatically detects unusual spending patterns using machine learning.

# Finance Anomaly Detector — HackFest 2026

A full-stack web app that detects unusual spending patterns in personal finance data using Isolation Forest ML. Supports PhonePe CSV/PDF exports and generic bank statement formats.

## Live Link
Link - https://finance-anomaly-detector.vercel.app
app tiyari karili

# Project Structure
```
finance-anomaly-detector/
├── backend/
│   ├── app/
│   │   ├── main.py            
│   │   ├── config.py           
│   │   ├── database.py          
│   │   ├── models.py            
│   │   ├── models_db.py         
│   │   ├── routes/
│   │   │   ├── auth.py       
│   │   │   └── transactions.py  
│   │   └── services/
│   │       ├── anomaly.py       
│   │       └── explainer.py    
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
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
├── sample_transactions.csv
├── .gitignore
└── README.md
```

## Tech Stack

- **Frontend** — React 18, Vite, Recharts, Axios
- **Backend** — FastAPI (Python), SQLAlchemy, passlib, python-jose
- **Database** — PostgreSQL (Railway built-in)
- **ML** — Isolation Forest (scikit-learn), pandas, numpy
- **Deploy** — Railway (backend + database), Vercel (frontend)

## Setup

### 1. Database — Railway PostgreSQL

1. Go to [railway.app](https://railway.app) and create a new project
2. Click **+ New** → **Database** → **Add PostgreSQL**
3. Click the PostgreSQL service → **Variables** tab
4. Copy the `DATABASE_URL` value — you will need this in step 2
5. Tables are created **automatically** when the backend starts — no SQL to run manually

### 2. Backend
```bash
cd backend
pip install -r requirements.txt


cp .env.example .env

uvicorn app.main:app --reload
```

Your `.env` file should look like:
```
DATABASE_URL=postgresql://postgres:yourpassword@monorail.proxy.rlwy.net:12345/railway
SECRET_KEY=your-long-random-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

To generate a secure SECRET_KEY, run:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Frontend
```bash
cd frontend
npm install

cp .env.example .env

npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Creating an Admin User

1. Sign up normally through the app
2. Connect to your Railway PostgreSQL using any SQL client (e.g. TablePlus, DBeaver)
3. Run this query with your email:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@youremail.com';
```
4. Log out and log back in — admin access is now active

## Supported File Formats

| Format | Columns Expected |
|--------|-----------------|
| PhonePe CSV | Date, Transaction Details, Type, Amount |
| Generic bank CSV | date, merchant/description/narration, amount/debit |
| PhonePe PDF | Auto-extracted from statement table |
| Generic bank PDF | Auto-extracted from statement table |

## Deploy

### Backend → Railway
1. Push your code to GitHub
2. In Railway — **+ New** → **GitHub Repo** → select your repo
3. Set root directory to `backend`
4. Add environment variables: `DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`
5. Railway auto-detects the Dockerfile and deploys

### Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL` = your Railway backend URL
4. Deploy

## How It Works

1. User uploads a bank statement (CSV or PDF)
2. App auto-detects the format (PhonePe or generic)
3. Isolation Forest ML model scores every transaction 0–1 for anomaly likelihood
4. Flagged transactions get human-readable explanations
5. Results shown in dashboard with category charts and filterable transaction list
