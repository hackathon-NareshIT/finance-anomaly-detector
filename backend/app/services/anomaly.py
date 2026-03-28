import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
import io


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
    "netflix": "Entertainment",
    "spotify": "Entertainment",
    "hotstar": "Entertainment",
    "bookmyshow": "Entertainment",
    "electricity": "Utilities",
    "bescom": "Utilities",
    "water": "Utilities",
    "gas": "Utilities",
    "airtel": "Utilities",
    "jio": "Utilities",
}


def infer_category(merchant: str) -> str:
    m = merchant.lower()
    for keyword, category in CATEGORY_MAP.items():
        if keyword in m:
            return category
    return "Other"


def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    """
    Accepts CSVs with columns: date, merchant/description, amount
    Flexible column name matching for various bank export formats.
    """
    df = pd.read_csv(io.BytesIO(file_bytes))
    df.columns = df.columns.str.strip().str.lower()

    col_map = {}
    for col in df.columns:
        if any(k in col for k in ["date", "time", "txn date", "transaction date"]):
            col_map[col] = "date"
        elif any(k in col for k in ["merchant", "description", "narration", "particulars", "details"]):
            col_map[col] = "merchant"
        elif any(k in col for k in ["debit", "amount", "dr", "withdrawal"]):
            col_map[col] = "amount"

    df = df.rename(columns=col_map)

    required = ["date", "merchant", "amount"]
    for r in required:
        if r not in df.columns:
            raise ValueError(f"Column '{r}' not found. Please ensure your CSV has date, merchant/description, and amount columns.")

    df["amount"] = pd.to_numeric(df["amount"].astype(str).str.replace(",", "").str.replace("₹", ""), errors="coerce")
    df = df.dropna(subset=["amount"])
    df = df[df["amount"] > 0].copy()

    df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors="coerce")
    df = df.dropna(subset=["date"])

    df["merchant"] = df["merchant"].astype(str).str.strip()
    df["category"] = df["merchant"].apply(infer_category)

    df = df.reset_index(drop=True)
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
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
    """
    Run Isolation Forest. Returns anomaly scores and labels.
    contamination = expected fraction of anomalies (10% default).
    """
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
    if max_s == min_s:
        normalized = np.zeros(len(raw_scores))
    else:
        normalized = 1 - (raw_scores - min_s) / (max_s - min_s)

    predictions = model.predict(X)  

    df_feat["anomaly_score"] = normalized
    df_feat["is_anomaly"] = predictions == -1

    return df_feat


def analyze(file_bytes: bytes) -> dict:
    """Full pipeline: parse → feature engineer → detect → explain → return results."""
    df = parse_csv(file_bytes)
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
