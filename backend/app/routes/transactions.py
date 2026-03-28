from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models_db import User, ScanHistory
from app.routes.auth import get_current_user, get_admin_user
from app.services.anomaly import analyze
from app.services.explainer import enrich_with_reasons

router = APIRouter(prefix="/transactions", tags=["transactions"])

MAX_FILE_SIZE = 5 * 1024 * 1024


@router.post("/upload")
def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filename_lower = file.filename.lower()
    if not (filename_lower.endswith(".csv") or filename_lower.endswith(".pdf")):
        raise HTTPException(status_code=400, detail="Only CSV or PDF files are accepted.")

    content = file.file.read()
    if len(content) > 10 * 1024 * 1024:  
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    file_ext = "pdf" if filename_lower.endswith(".pdf") else "csv"

    try:
        result = analyze(content, file_extension=file_ext)
        result = enrich_with_reasons(result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    scan = ScanHistory(
        user_id=current_user.id,
        filename=file.filename,
        total_transactions=result["total_transactions"],
        anomaly_count=result["anomaly_count"],
        results=result,
    )
    db.add(scan)
    db.commit()

    return result


@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get scan history for the logged-in user."""
    scans = (
        db.query(
            ScanHistory.id,
            ScanHistory.filename,
            ScanHistory.total_transactions,
            ScanHistory.anomaly_count,
            ScanHistory.created_at,
        )
        .filter(ScanHistory.user_id == current_user.id)
        .order_by(ScanHistory.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": str(s.id),
            "filename": s.filename,
            "total_transactions": s.total_transactions,
            "anomaly_count": s.anomaly_count,
            "created_at": s.created_at.isoformat(),
        }
        for s in scans
    ]


@router.get("/history/{scan_id}")
def get_scan_detail(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full results of a specific past scan (only owner can access)."""
    scan = (
        db.query(ScanHistory)
        .filter(ScanHistory.id == scan_id, ScanHistory.user_id == current_user.id)
        .first()
    )
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return {
        "id": str(scan.id),
        "filename": scan.filename,
        "total_transactions": scan.total_transactions,
        "anomaly_count": scan.anomaly_count,
        "created_at": scan.created_at.isoformat(),
        "results": scan.results,
    }


@router.get("/admin/all-scans")
def admin_all_scans(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    """Admin only: view summary of all users' scans."""
    scans = (
        db.query(
            ScanHistory.id,
            ScanHistory.user_id,
            ScanHistory.filename,
            ScanHistory.total_transactions,
            ScanHistory.anomaly_count,
            ScanHistory.created_at,
        )
        .order_by(ScanHistory.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": str(s.id),
            "user_id": str(s.user_id),
            "filename": s.filename,
            "total_transactions": s.total_transactions,
            "anomaly_count": s.anomaly_count,
            "created_at": s.created_at.isoformat(),
        }
        for s in scans
    ]

