import pandas as pd


def generate_reason(row: dict, all_transactions: list) -> str:
    """
    Generate a human-readable explanation for why a transaction was flagged.
    Uses simple rule-based logic on top of the anomaly score.
    """
    reasons = []
    merchant = row["merchant"]
    amount = row["amount"]
    category = row["category"]
    score = row["anomaly_score"]

    same_cat = [t for t in all_transactions if t["category"] == category and t["id"] != row["id"]]

    if same_cat:
        avg_cat = sum(t["amount"] for t in same_cat) / len(same_cat)
        ratio = amount / avg_cat if avg_cat > 0 else 1

        if ratio >= 3:
            reasons.append(f"{ratio:.1f}× your average {category.lower()} spend (avg ₹{avg_cat:,.0f})")
        elif ratio >= 2:
            reasons.append(f"2× higher than your usual {category.lower()} spend")

    all_amounts = [t["amount"] for t in all_transactions]
    overall_avg = sum(all_amounts) / len(all_amounts)
    overall_ratio = amount / overall_avg if overall_avg > 0 else 1

    if overall_ratio >= 5 and not reasons:
        reasons.append(f"Very large transaction — {overall_ratio:.1f}× your overall average spend")

    merchant_count = sum(1 for t in all_transactions if t["merchant"].lower() == merchant.lower())
    if merchant_count == 1:
        reasons.append("First time spending at this merchant")

    if not reasons:
        if score >= 0.85:
            reasons.append("Multiple unusual patterns: amount, timing, and merchant all deviate from your norm")
        elif score >= 0.7:
            reasons.append("Combination of unusual amount and spending pattern")

    return " · ".join(reasons) if reasons else "Unusual spending pattern detected by ML model"


def enrich_with_reasons(result: dict) -> dict:
    """Add human-readable reasons to all anomalous transactions."""
    transactions = result["transactions"]

    for txn in transactions:
        if txn["is_anomaly"]:
            txn["reason"] = generate_reason(txn, transactions)

    return result
