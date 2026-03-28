import pandas as pd
import numpy as np
import io
import re
import pdfplumber
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder


CATEGORY_MAP = {
    "zomato": "Food & dining",
    "swiggy": "Food & dining",
    "restaurant": "Food & dining",
    "food": "Food & dining",
    "hotel": "Food & dining",
    "dosa": "Food & dining",
    "snack": "Food & dining",
    "bakery": "Food & dining",
    "bekery": "Food & dining",
    "lassi": "Food & dining",
    "pizza": "Food & dining",
    "dominos": "Food & dining",
    "taratarini": "Food & dining",
    "gupchup": "Food & dining",
    "uber": "Transport",
    "ola": "Transport",
    "rapido": "Transport",
    "metro": "Transport",
    "railways": "Transport",
    "filling station": "Transport",
    "fuel": "Transport",
    "amazon": "Shopping",
    "flipkart": "Shopping",
    "myntra": "Shopping",
    "meesho": "Shopping",
    "ekart": "Shopping",
    "zepto": "Shopping",
    "patanjali": "Shopping",
    "netflix": "Entertainment",
    "spotify": "Entertainment",
    "hotstar": "Entertainment",
    "bookmyshow": "Entertainment",
    "google": "Entertainment",
    "jio": "Utilities",
    "airtel": "Utilities",
    "bsnl": "Utilities",
    "electricity": "Utilities",
    "bescom": "Utilities",
    "medical": "Health",
    "medicals": "Health",
    "pharmacy": "Health",
    "hospital": "Health",
    "salon": "Personal care",
    "saloon": "Personal care",
    "hair": "Personal care",
}


def infer_category(merchant):
    m = str(merchant).lower()
    for k, v in CATEGORY_MAP.items():
        if k in m:
            return v
    return "Other"


# ── CSV Parsing ───────────────────────────────────────────────────

def is_phonepe_format(df):
    cols = [c.lower().strip() for c in df.columns]
    return (
        any("transaction details" in c or "details" in c for c in cols)
        and any("type" in c for c in cols)
    )


def parse_phonepe_csv(df):
    df.columns = df.columns.str.strip().str.lower()
    col_map = {}
    for col in df.columns:
        if "date" in col:
            col_map[col] = "date"
        elif "transaction details" in col or "details" in col:
            col_map[col] = "merchant"
        elif col == "type" or "dr/cr" in col:
            col_map[col] = "type"
        elif "amount" in col:
            col_map[col] = "amount"
    df = df.rename(columns=col_map)
    for r in ["date", "merchant", "amount"]:
        if r not in df.columns:
            raise ValueError(f"Column '{r}' not found in PhonePe CSV.")
    if "type" in df.columns:
        df = df[df["type"].str.lower().str.strip().isin(
            ["debit", "dr", "debit (dr)", "paid"]
        )]
    df["amount"] = (
        df["amount"].astype(str)
        .str.replace(r"[₹Rs,\s]", "", regex=True)
        .str.replace(r"\(.*?\)", "", regex=True)
        .pipe(pd.to_numeric, errors="coerce")
    )
    df = df.dropna(subset=["amount"])
    df = df[df["amount"] > 0]
    df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors="coerce")
    df = df.dropna(subset=["date"])
    df["merchant"] = df["merchant"].astype(str).str.strip()
    df["category"] = df["merchant"].apply(infer_category)
    return df.reset_index(drop=True)


def parse_generic_csv(df):
    df.columns = df.columns.str.strip().str.lower()
    col_map = {}
    for col in df.columns:
        if any(k in col for k in ["date", "txn date", "transaction date", "value date"]):
            col_map[col] = "date"
        elif any(k in col for k in ["merchant", "description", "narration", "particulars", "details", "remarks"]):
            col_map[col] = "merchant"
        elif any(k in col for k in ["debit", "withdrawal", "dr amount"]):
            col_map[col] = "amount"
        elif col == "amount" and "amount" not in col_map.values():
            col_map[col] = "amount"
    df = df.rename(columns=col_map)
    for r in ["date", "merchant", "amount"]:
        if r not in df.columns:
            raise ValueError(
                f"Column '{r}' not found. CSV must have date, "
                "merchant/description, and amount/debit columns."
            )
    df["amount"] = pd.to_numeric(
        df["amount"].astype(str).str.replace(r"[₹Rs,\s]", "", regex=True),
        errors="coerce"
    )
    df = df.dropna(subset=["amount"])
    df = df[df["amount"] > 0]
    df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors="coerce")
    df = df.dropna(subset=["date"])
    df["merchant"] = df["merchant"].astype(str).str.strip()
    df["category"] = df["merchant"].apply(infer_category)
    return df.reset_index(drop=True)


def parse_csv(file_bytes):
    try:
        raw = pd.read_csv(io.BytesIO(file_bytes))
    except Exception:
        raise ValueError("Could not read the file as CSV.")
    if raw.shape[1] < 2:
        for skip in range(1, 6):
            try:
                raw = pd.read_csv(io.BytesIO(file_bytes), skiprows=skip)
                if raw.shape[1] >= 3:
                    break
            except Exception:
                continue
    if is_phonepe_format(raw):
        return parse_phonepe_csv(raw)
    else:
        return parse_generic_csv(raw)


# ── PDF Parsing ───────────────────────────────────────────────────

# This regex matches the EXACT format pdfplumber extracts from PhonePe PDFs:
# "Mar 28, 2026 Paid to Subhasish Odisha DEBIT ₹50"
# All on ONE line: date + description + type + amount

PHONEPE_LINE_RE = re.compile(
    r"^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})\s+"
    r"(.+?)\s+(DEBIT|CREDIT)\s+₹([\d,]+(?:\.\d{1,2})?)$"
)


def parse_phonepe_pdf(file_bytes):
    """
    Parse PhonePe PDF statement.

    pdfplumber extracts each transaction as a SINGLE line:
      'Mar 28, 2026 Paid to Subhasish Odisha DEBIT ₹50'

    We match this with one regex — no multi-line logic needed.
    Only DEBIT rows are kept.
    """
    data = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            for line in text.split("\n"):
                line = line.strip()
                m = PHONEPE_LINE_RE.match(line)
                if not m:
                    continue
                if m.group(3) != "DEBIT":
                    continue
                try:
                    amount = float(m.group(4).replace(",", ""))
                except ValueError:
                    continue
                if amount <= 0 or amount > 500000:
                    continue
                data.append({
                    "date":     m.group(1),
                    "merchant": m.group(2).strip()[:100],
                    "amount":   amount,
                })

    if not data:
        raise ValueError(
            "No DEBIT transactions found in this PDF. "
            "Please make sure it is a PhonePe statement PDF, or use CSV export."
        )

    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"], format="%b %d, %Y", errors="coerce")
    df = df.dropna(subset=["date"])
    df["category"] = df["merchant"].apply(infer_category)
    return df.reset_index(drop=True)


def parse_generic_bank_pdf(file_bytes):
    """
    Fallback for non-PhonePe bank PDFs (HDFC, SBI, ICICI etc.)
    that export data as actual PDF tables.
    """
    all_rows = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue
                header = [str(h).strip().lower() if h else "" for h in table[0]]
                for row in table[1:]:
                    if row and any(cell for cell in row):
                        all_rows.append(dict(zip(
                            header,
                            [str(c).strip() if c else "" for c in row]
                        )))
    if not all_rows:
        raise ValueError("No transaction table found in PDF.")
    df = pd.DataFrame(all_rows)
    if is_phonepe_format(df):
        return parse_phonepe_csv(df)
    return parse_generic_csv(df)


def parse_pdf(file_bytes):
    """
    Strategy:
    1. Try PhonePe single-line text parser first (handles your PDF perfectly)
    2. Fall back to table extraction for other bank PDFs
    """
    # Strategy 1 — PhonePe text-based (confirmed working on your PDF)
    try:
        result = parse_phonepe_pdf(file_bytes)
        if len(result) >= 3:
            return result
    except ValueError as e:
        phonepe_error = str(e)
    except Exception as e:
        phonepe_error = str(e)
    else:
        phonepe_error = ""

    # Strategy 2 — Generic bank PDF table extraction
    try:
        result = parse_generic_bank_pdf(file_bytes)
        if len(result) >= 3:
            return result
    except Exception:
        pass

    raise ValueError(
        "Could not extract transactions from this PDF. "
        f"PhonePe parser: {phonepe_error}. "
        "Please try CSV export from PhonePe: Profile → Statement → Download."
    )


# ── Feature Engineering ───────────────────────────────────────────

def engineer_features(df):
    df = df.copy()
    df["hour"]           = df["date"].dt.hour
    df["day_of_week"]    = df["date"].dt.dayofweek
    df["day_of_month"]   = df["date"].dt.day
    df["log_amount"]     = np.log1p(df["amount"])
    df["amount_vs_mean"] = df["amount"] / df["amount"].mean()
    cat_means            = df.groupby("category")["amount"].transform("mean")
    cat_stds             = df.groupby("category")["amount"].transform("std").fillna(1)
    df["amount_z_score"] = (df["amount"] - cat_means) / cat_stds
    le                   = LabelEncoder()
    df["category_enc"]   = le.fit_transform(df["category"])
    return df


# ── Isolation Forest ──────────────────────────────────────────────

def run_model(df):
    df = engineer_features(df)
    feature_cols = [
        "log_amount", "amount_z_score", "amount_vs_mean",
        "hour", "day_of_week", "category_enc",
    ]
    X = df[feature_cols].fillna(0).values
    model = IsolationForest(
        n_estimators=200,
        contamination=0.1,
        random_state=42,
        max_samples="auto",
    )
    model.fit(X)
    scores          = model.score_samples(X)
    min_s, max_s    = scores.min(), scores.max()
    normalized      = (
        np.zeros(len(scores)) if max_s == min_s
        else 1 - (scores - min_s) / (max_s - min_s)
    )
    df["anomaly_score"] = normalized
    df["is_anomaly"]    = model.predict(X) == -1
    return df


# ── Entry Point ───────────────────────────────────────────────────

def analyze(file_bytes, file_extension="csv"):
    if file_extension == "pdf":
        df = parse_pdf(file_bytes)
    else:
        df = parse_csv(file_bytes)

    if len(df) < 5:
        raise ValueError(
            f"Only {len(df)} valid debit transactions found. "
            "Please upload a statement with at least 5 transactions."
        )

    df_result = run_model(df)

    transactions = []
    for i, row in df_result.iterrows():
        try:
            d = row["date"].strftime("%b %d")
        except Exception:
            d = "N/A"
        transactions.append({
            "id":            int(i),
            "date":          d,
            "merchant":      str(row["merchant"]),
            "category":      str(row["category"]),
            "amount":        round(float(row["amount"]), 2),
            "anomaly_score": round(float(row["anomaly_score"]), 2),
            "is_anomaly":    bool(row["is_anomaly"]),
            "reason":        None,
        })

    transactions.sort(key=lambda t: (-t["is_anomaly"], -t["anomaly_score"]))

    category_breakdown = (
        df_result.groupby("category")["amount"].sum().round(2).to_dict()
    )

    return {
        "total_transactions": len(transactions),
        "anomaly_count":      int(df_result["is_anomaly"].sum()),
        "total_spent":        round(float(df_result["amount"].sum()), 2),
        "avg_transaction":    round(float(df_result["amount"].mean()), 2),
        "category_breakdown": category_breakdown,
        "transactions":       transactions,
    }