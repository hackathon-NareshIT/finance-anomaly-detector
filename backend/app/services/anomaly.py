import pandas as pd
import numpy as np
import io
import pdfplumber
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder


CATEGORY_MAP = {
    "food": "Food & dining",
    "restaurant": "Food & dining",
    "zomato": "Food & dining",
    "swiggy": "Food & dining",
    "uber eats": "Food & dining",
    "uber": "Transport",
    "ola": "Transport",
    "metro": "Transport",
    "bus": "Transport",
    "rapido": "Transport",
    "amazon": "Shopping",
    "flipkart": "Shopping",
    "myntra": "Shopping",
    "meesho": "Shopping",
    "ajio": "Shopping",
    "netflix": "Entertainment",
    "spotify": "Entertainment",
    "hotstar": "Entertainment",
    "bookmyshow": "Entertainment",
    "youtube": "Entertainment",
    "electricity": "Utilities",
    "bescom": "Utilities",
    "water": "Utilities",
    "gas": "Utilities",
    "airtel": "Utilities",
    "jio": "Utilities",
    "bsnl": "Utilities",
    "phonepe": "Transfer",
    "gpay": "Transfer",
    "paytm": "Transfer",
    "upi": "Transfer",
    "neft": "Transfer",
    "imps": "Transfer",
}


def infer_category(merchant: str) -> str:
    m = merchant.lower()
    for keyword, category in CATEGORY_MAP.items():
        if keyword in m:
            return category
    return "Other"


def is_phonepe_format(df: pd.DataFrame) -> bool:
    """Detect if the CSV is a PhonePe export by checking column names."""
    cols = [c.lower().strip() for c in df.columns]
    return (
        any("transaction details" in c or "details" in c for c in cols) and
        any("type" in c for c in cols)
    )


def parse_phonepe_csv(df: pd.DataFrame) -> pd.DataFrame:
    """
    Parse PhonePe CSV format:
    Columns: Date | Transaction Details | Type | Amount
    Only keep Debit rows (spending).
    """
    df.columns = df.columns.str.strip().str.lower()

    col_map = {}
    for col in df.columns:
        if "date" in col:
            col_map[col] = "date"
        elif "transaction details" in col or "details" in col or "description" in col or "narration" in col:
            col_map[col] = "merchant"
        elif col == "type" or "dr/cr" in col or "txn type" in col:
            col_map[col] = "type"
        elif "amount" in col:
            col_map[col] = "amount"

    df = df.rename(columns=col_map)

    for required in ["date", "merchant", "amount"]:
        if required not in df.columns:
            raise ValueError(f"Could not find '{required}' column in PhonePe CSV.")

    if "type" in df.columns:
        df = df[df["type"].str.lower().str.strip().isin(["debit", "dr", "debit (dr)", "paid"])]

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


def parse_generic_csv(df: pd.DataFrame) -> pd.DataFrame:
    """
    Parse any generic bank CSV format with flexible column matching.
    Columns: date, merchant/description/narration, amount/debit
    """
    df.columns = df.columns.str.strip().str.lower()

    col_map = {}
    for col in df.columns:
        if any(k in col for k in ["date", "time", "txn date", "transaction date", "value date"]):
            col_map[col] = "date"
        elif any(k in col for k in ["merchant", "description", "narration", "particulars", "details", "remarks"]):
            col_map[col] = "merchant"
        elif any(k in col for k in ["debit", "withdrawal", "dr amount"]):
            col_map[col] = "amount"
        elif col == "amount" and "amount" not in col_map.values():
            col_map[col] = "amount"

    df = df.rename(columns=col_map)

    for required in ["date", "merchant", "amount"]:
        if required not in df.columns:
            raise ValueError(
                f"Column '{required}' not found. CSV must have date, "
                f"merchant/description, and amount/debit columns."
            )

    df["amount"] = (
        pd.to_numeric(
            df["amount"].astype(str)
            .str.replace(r"[₹Rs,\s]", "", regex=True),
            errors="coerce"
        )
    )
    df = df.dropna(subset=["amount"])
    df = df[df["amount"] > 0]
    df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors="coerce")
    df = df.dropna(subset=["date"])
    df["merchant"] = df["merchant"].astype(str).str.strip()
    df["category"] = df["merchant"].apply(infer_category)
    return df.reset_index(drop=True)


def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    """
    Auto-detect format (PhonePe or generic) and parse accordingly.
    """
    try:
        raw = pd.read_csv(io.BytesIO(file_bytes))
    except Exception:
        raise ValueError("Could not read the file as CSV. Please check the format.")
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


def parse_pdf(file_bytes: bytes) -> pd.DataFrame:
    """
    Extract transaction table from a bank/PhonePe PDF statement.
    Tries all pages and picks the table with the most rows.
    """
    all_rows = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue
                # Use first row as header
                header = [str(h).strip().lower() if h else "" for h in table[0]]
                for row in table[1:]:
                    if row and any(cell for cell in row):
                        all_rows.append(dict(zip(header, [str(c).strip() if c else "" for c in row])))

    if not all_rows:
        raise ValueError(
            "No transaction table found in the PDF. "
            "Please make sure it is a bank statement PDF with a transactions table."
        )

    df = pd.DataFrame(all_rows)

    # Now run through same format detection
    if is_phonepe_format(df):
        return parse_phonepe_csv(df)
    else:
        return parse_generic_csv(df)


def engineer_features(df: pd.DataFrame):
    """Extract numeric features for Isolation Forest."""
    df = df.copy()

    df["hour"] = df["date"].dt.hour
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_month"] = df["date"].dt.day

    cat_means = df.groupby("category")["amount"].transform("mean")
    cat_stds = df.groupby("category")["amount"].transform("std").fillna(1)
    df["amount_z_score"] = (df["amount"] - cat_means) / cat_stds

    df["log_amount"] = np.log1p(df["amount"])
    df["amount_vs_mean"] = df["amount"] / df["amount"].mean()

    le = LabelEncoder()
    df["category_enc"] = le.fit_transform(df["category"])

    return df, le


def run_isolation_forest(df: pd.DataFrame, contamination: float = 0.1):
    df_feat, le = engineer_features(df)

    feature_cols = [
        "log_amount",
        "amount_z_score",
        "amount_vs_mean",
        "hour",
        "day_of_week",
        "category_enc",
    ]

    X = df_feat[feature_cols].fillna(0).values

    model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        random_state=42,
        max_samples="auto",
    )
    model.fit(X)

    raw_scores = model.score_samples(X)
    min_s, max_s = raw_scores.min(), raw_scores.max()
    normalized = (
        np.zeros(len(raw_scores))
        if max_s == min_s
        else 1 - (raw_scores - min_s) / (max_s - min_s)
    )

    predictions = model.predict(X)

    df_feat["anomaly_score"] = normalized
    df_feat["is_anomaly"] = predictions == -1

    return df_feat


def analyze(file_bytes: bytes, file_extension: str = "csv") -> dict:
    """
    Full pipeline: parse (CSV or PDF) → features → detect → return results.
    file_extension: 'csv' or 'pdf'
    """
    if file_extension == "pdf":
        df = parse_pdf(file_bytes)
    else:
        df = parse_csv(file_bytes)

    if len(df) < 5:
        raise ValueError(
            f"Only {len(df)} valid debit transactions found. "
            "Please upload a statement with at least 5 spending transactions."
        )

    df_result = run_isolation_forest(df)

    transactions = []
    for idx, row in df_result.iterrows():
        transactions.append({
            "id": idx,
            "date": row["date"].strftime("%b %d"),
            "merchant": row["merchant"],
            "category": row["category"],
            "amount": round(float(row["amount"]), 2),
            "anomaly_score": round(float(row["anomaly_score"]), 2),
            "is_anomaly": bool(row["is_anomaly"]),
            "reason": None,
        })

    transactions.sort(key=lambda t: (-t["is_anomaly"], -t["anomaly_score"]))

    cat_breakdown = (
        df_result.groupby("category")["amount"]
        .sum()
        .round(2)
        .to_dict()
    )

    return {
        "total_transactions": len(transactions),
        "anomaly_count": int(df_result["is_anomaly"].sum()),
        "total_spent": round(float(df_result["amount"].sum()), 2),
        "avg_transaction": round(float(df_result["amount"].mean()), 2),
        "category_breakdown": cat_breakdown,
        "transactions": transactions,
    }